<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankAccount;
use App\Models\BankReconciliation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BankReconciliationController extends Controller
{
    // ── Bank Accounts (master data) ───────────────────────────────────────────

    public function bankAccounts(Request $request): JsonResponse
    {
        $query = BankAccount::query();
        if ($request->filled('bank_name')) {
            $query->where('bank_name', $request->bank_name);
        }
        $accounts = $query->where('is_active', true)->orderBy('bank_name')->orderBy('sort_order')->get();

        // Group by bank
        $grouped = $accounts->groupBy('bank_name');

        return response()->json(['accounts' => $accounts, 'grouped' => $grouped]);
    }

    public function storeBankAccount(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bank_name'      => 'required|string|max:50',
            'internal_code'  => 'nullable|string|max:30',
            'account_number' => 'nullable|string|max:30',
            'account_name'   => 'required|string|max:255',
            'sort_order'     => 'nullable|integer',
            'is_active'      => 'nullable|boolean',
        ]);

        $account = BankAccount::create($data);

        return response()->json($account, 201);
    }

    public function updateBankAccount(Request $request, BankAccount $bankAccount): JsonResponse
    {
        $data = $request->validate([
            'bank_name'      => 'sometimes|string|max:50',
            'internal_code'  => 'nullable|string|max:30',
            'account_number' => 'nullable|string|max:30',
            'account_name'   => 'sometimes|string|max:255',
            'sort_order'     => 'nullable|integer',
            'is_active'      => 'nullable|boolean',
        ]);

        $bankAccount->update($data);

        return response()->json($bankAccount);
    }

    public function destroyBankAccount(BankAccount $bankAccount): JsonResponse
    {
        $bankAccount->delete();

        return response()->json(['message' => 'Rekening bank berhasil dihapus.']);
    }

    // ── Reconciliation data (per period) ─────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year',  now()->year);

        $recons = BankReconciliation::with('bankAccount')
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->get()
            ->keyBy('bank_account_id');

        // Get all active bank accounts, merge with reconciliation data
        $accounts = BankAccount::where('is_active', true)
            ->orderBy('bank_name')
            ->orderBy('sort_order')
            ->get()
            ->map(function ($acc) use ($recons) {
                $recon = $recons->get($acc->id);
                return [
                    'bank_account_id' => $acc->id,
                    'bank_name'       => $acc->bank_name,
                    'internal_code'   => $acc->internal_code,
                    'account_number'  => $acc->account_number,
                    'account_name'    => $acc->account_name,
                    'sort_order'      => $acc->sort_order,
                    'opening_balance' => $recon ? (float) $recon->opening_balance : 0,
                    'closing_balance' => $recon ? (float) $recon->closing_balance : 0,
                    'notes'           => $recon?->notes,
                ];
            });

        $grouped = $accounts->groupBy('bank_name');

        $summaries = $grouped->map(fn($rows) => [
            'total_opening' => $rows->sum('opening_balance'),
            'total_closing' => $rows->sum('closing_balance'),
        ]);

        return response()->json([
            'period_month' => $month,
            'period_year'  => $year,
            'accounts'     => $accounts,
            'grouped'      => $grouped,
            'summaries'    => $summaries,
        ]);
    }

    public function bulkSave(Request $request): JsonResponse
    {
        $request->validate([
            'period_month'                => 'required|integer|min:1|max:12',
            'period_year'                 => 'required|integer|min:2000|max:2100',
            'rows'                        => 'required|array',
            'rows.*.bank_account_id'      => 'required|integer|exists:bank_accounts,id',
            'rows.*.opening_balance'      => 'nullable|numeric|min:0',
            'rows.*.closing_balance'      => 'nullable|numeric|min:0',
            'rows.*.notes'                => 'nullable|string',
        ]);

        $month = (int) $request->period_month;
        $year  = (int) $request->period_year;

        foreach ($request->rows as $row) {
            BankReconciliation::updateOrCreate(
                ['period_month' => $month, 'period_year' => $year, 'bank_account_id' => $row['bank_account_id']],
                ['opening_balance' => (float) ($row['opening_balance'] ?? 0), 'closing_balance' => (float) ($row['closing_balance'] ?? 0), 'notes' => $row['notes'] ?? null]
            );
        }

        return $this->index($request);
    }

    // Copy reconciliation from previous period
    public function copyFromPrevious(Request $request): JsonResponse
    {
        $request->validate([
            'from_month' => 'required|integer|min:1|max:12',
            'from_year'  => 'required|integer|min:2000',
            'to_month'   => 'required|integer|min:1|max:12',
            'to_year'    => 'required|integer|min:2000',
        ]);

        $source = BankReconciliation::where('period_month', $request->from_month)
            ->where('period_year', $request->from_year)
            ->get();

        foreach ($source as $row) {
            BankReconciliation::updateOrCreate(
                ['period_month' => $request->to_month, 'period_year' => $request->to_year, 'bank_account_id' => $row->bank_account_id],
                // Closing of previous becomes opening of next
                ['opening_balance' => $row->closing_balance, 'closing_balance' => 0]
            );
        }

        $newRequest = new Request(['month' => $request->to_month, 'year' => $request->to_year]);
        return $this->index($newRequest);
    }
}
