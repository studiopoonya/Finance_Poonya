<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MonthlyBalance;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlyBalanceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = (int) $request->get('month', now()->month);
        $year  = (int) $request->get('year',  now()->year);

        $rows = MonthlyBalance::where('period_month', $month)
            ->where('period_year', $year)
            ->orderBy('sort_order')
            ->orderBy('account_code')
            ->get();

        $totalDebit  = $rows->sum('debit');
        $totalCredit = $rows->sum('credit');

        return response()->json([
            'period_month' => $month,
            'period_year'  => $year,
            'rows'         => $rows,
            'total_debit'  => (float) $totalDebit,
            'total_credit' => (float) $totalCredit,
            'is_balanced'  => abs($totalDebit - $totalCredit) < 1,
        ]);
    }

    // Bulk save all rows for a period (upsert)
    public function bulkSave(Request $request): JsonResponse
    {
        $request->validate([
            'period_month'         => 'required|integer|min:1|max:12',
            'period_year'          => 'required|integer|min:2000|max:2100',
            'rows'                 => 'required|array',
            'rows.*.account_code'  => 'required|string|max:20',
            'rows.*.account_name'  => 'required|string|max:255',
            'rows.*.debit'         => 'nullable|numeric|min:0',
            'rows.*.credit'        => 'nullable|numeric|min:0',
            'rows.*.sort_order'    => 'nullable|integer',
            'rows.*.notes'         => 'nullable|string',
        ]);

        $month = (int) $request->period_month;
        $year  = (int) $request->period_year;

        // Delete existing rows then re-insert (simpler than complex upsert)
        MonthlyBalance::where('period_month', $month)->where('period_year', $year)->delete();

        foreach ($request->rows as $idx => $row) {
            if (empty($row['account_code'])) continue;
            MonthlyBalance::create([
                'period_month' => $month,
                'period_year'  => $year,
                'account_code' => $row['account_code'],
                'account_name' => $row['account_name'],
                'debit'        => (float) ($row['debit']  ?? 0),
                'credit'       => (float) ($row['credit'] ?? 0),
                'sort_order'   => $row['sort_order'] ?? $idx,
                'notes'        => $row['notes'] ?? null,
            ]);
        }

        return $this->index($request);
    }

    // Copy balances from one period to another (closing → next month opening)
    public function copyFromPrevious(Request $request): JsonResponse
    {
        $request->validate([
            'from_month' => 'required|integer|min:1|max:12',
            'from_year'  => 'required|integer|min:2000',
            'to_month'   => 'required|integer|min:1|max:12',
            'to_year'    => 'required|integer|min:2000',
        ]);

        $source = MonthlyBalance::where('period_month', $request->from_month)
            ->where('period_year', $request->from_year)
            ->orderBy('sort_order')
            ->get();

        if ($source->isEmpty()) {
            return response()->json(['message' => 'Tidak ada data di periode sumber.'], 404);
        }

        MonthlyBalance::where('period_month', $request->to_month)
            ->where('period_year', $request->to_year)
            ->delete();

        foreach ($source as $row) {
            MonthlyBalance::create([
                'period_month' => $request->to_month,
                'period_year'  => $request->to_year,
                'account_code' => $row->account_code,
                'account_name' => $row->account_name,
                'debit'        => $row->debit,
                'credit'       => $row->credit,
                'sort_order'   => $row->sort_order,
                'notes'        => $row->notes,
            ]);
        }

        $newRequest = new Request(['month' => $request->to_month, 'year' => $request->to_year]);
        return $this->index($newRequest);
    }

    // List all periods that have data
    public function periods(): JsonResponse
    {
        $periods = MonthlyBalance::selectRaw('period_month, period_year, COUNT(*) as row_count')
            ->groupBy('period_year', 'period_month')
            ->orderBy('period_year', 'desc')
            ->orderBy('period_month', 'desc')
            ->get();

        return response()->json($periods);
    }
}
