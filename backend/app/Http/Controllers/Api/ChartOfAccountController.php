<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChartOfAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $revenueTotals = Transaction::revenue()
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        $expenseTotals = Transaction::expense()
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category');

        $accounts = ChartOfAccount::orderBy('sort_order')
            ->get()
            ->map(function (ChartOfAccount $a) use ($revenueTotals, $expenseTotals) {
                $total = 0;
                if ($a->maps_to_category) {
                    $total = in_array($a->report_category, ['revenue', 'other_income'])
                        ? (float) ($revenueTotals[$a->maps_to_category] ?? 0)
                        : (float) ($expenseTotals[$a->maps_to_category] ?? 0);
                }
                return [
                    'code'             => $a->code,
                    'name'             => $a->name,
                    'account_level'    => $a->account_level,
                    'statement_type'   => $a->statement_type,
                    'normal_balance'   => $a->normal_balance,
                    'report_category'  => $a->report_category,
                    'parent_code'      => $a->parent_code,
                    'maps_to_category' => $a->maps_to_category,
                    'description'      => $a->description,
                    'is_active'        => $a->is_active,
                    'sort_order'       => $a->sort_order,
                    'transaction_total'=> $total,
                ];
            });

        return response()->json([
            'balance_sheet'    => $accounts->where('statement_type', 'balance_sheet')->values(),
            'income_statement' => $accounts->where('statement_type', 'income_statement')->values(),
            'summary' => [
                'total_accounts'  => $accounts->count(),
                'detail_accounts' => $accounts->where('account_level', 'detail')->count(),
                'mapped_accounts' => $accounts->whereNotNull('maps_to_category')->count(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code'             => 'required|string|max:20|unique:chart_of_accounts,code',
            'name'             => 'required|string|max:255',
            'account_level'    => ['required', Rule::in(['group', 'subgroup', 'detail'])],
            'statement_type'   => ['required', Rule::in(['balance_sheet', 'income_statement'])],
            'normal_balance'   => ['required', Rule::in(['debit', 'credit'])],
            'report_category'  => ['required', Rule::in([
                'current_asset', 'fixed_asset', 'current_liability', 'long_term_liability',
                'equity', 'revenue', 'cogs', 'operating_expense', 'other_income', 'other_expense',
            ])],
            'parent_code'      => 'nullable|string|exists:chart_of_accounts,code',
            'maps_to_category' => 'nullable|string|max:100',
            'description'      => 'nullable|string',
            'sort_order'       => 'nullable|integer',
        ]);

        ChartOfAccount::create(array_merge($data, ['is_active' => true]));

        return response()->json(array_merge($data, ['is_active' => true, 'transaction_total' => 0]), 201);
    }

    public function update(Request $request, string $code): JsonResponse
    {
        $account = ChartOfAccount::where('code', $code)->firstOrFail();

        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'account_level'    => ['sometimes', Rule::in(['group', 'subgroup', 'detail'])],
            'statement_type'   => ['sometimes', Rule::in(['balance_sheet', 'income_statement'])],
            'normal_balance'   => ['sometimes', Rule::in(['debit', 'credit'])],
            'report_category'  => ['sometimes', Rule::in([
                'current_asset', 'fixed_asset', 'current_liability', 'long_term_liability',
                'equity', 'revenue', 'cogs', 'operating_expense', 'other_income', 'other_expense',
            ])],
            'parent_code'      => 'nullable|string|exists:chart_of_accounts,code',
            'maps_to_category' => 'nullable|string|max:100',
            'description'      => 'nullable|string',
            'sort_order'       => 'nullable|integer',
            'is_active'        => 'boolean',
        ]);

        $account->update($data);

        return response()->json([
            'code'             => $account->code,
            'name'             => $account->name,
            'account_level'    => $account->account_level,
            'statement_type'   => $account->statement_type,
            'normal_balance'   => $account->normal_balance,
            'report_category'  => $account->report_category,
            'parent_code'      => $account->parent_code,
            'maps_to_category' => $account->maps_to_category,
            'description'      => $account->description,
            'is_active'        => $account->is_active,
            'sort_order'       => $account->sort_order,
            'transaction_total'=> 0,
        ]);
    }

    public function destroy(string $code): JsonResponse
    {
        $account = ChartOfAccount::where('code', $code)->firstOrFail();

        if (ChartOfAccount::where('parent_code', $code)->exists()) {
            return response()->json(['error' => 'Tidak bisa menghapus akun yang masih memiliki akun turunan.'], 422);
        }

        $account->delete();

        return response()->json(['message' => 'Akun berhasil dihapus.']);
    }
}
