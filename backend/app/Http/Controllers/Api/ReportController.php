<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Invoice;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    // P&L Statement: Revenue - Expenses = Net Profit
    public function profitLoss(Request $request): JsonResponse
    {
        $year  = (int) $request->get('year', now()->year);
        $month = $request->get('month'); // null = full year

        $base = Transaction::whereYear('transaction_date', $year);
        if ($month) {
            $base->whereMonth('transaction_date', (int) $month);
        }

        $revenue = (clone $base)->revenue()
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $expenses = (clone $base)->expense()
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        $totalRevenue = $revenue->sum('total');
        $totalExpense = $expenses->sum('total');
        $netProfit    = $totalRevenue - $totalExpense;
        $margin       = $totalRevenue > 0 ? round($netProfit / $totalRevenue * 100, 2) : 0;

        // Monthly trend (always full year regardless of month filter)
        $trend = Transaction::whereYear('transaction_date', $year)
            ->selectRaw('MONTH(transaction_date) as month, type, SUM(amount) as total')
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get()
            ->groupBy('month')
            ->map(fn($rows) => [
                'revenue' => (float) ($rows->firstWhere('type', 'revenue')?->total ?? 0),
                'expense' => (float) ($rows->firstWhere('type', 'expense')?->total ?? 0),
            ]);

        return response()->json([
            'year'          => $year,
            'month'         => $month,
            'revenue_items' => $revenue,
            'expense_items' => $expenses,
            'total_revenue' => (float) $totalRevenue,
            'total_expense' => (float) $totalExpense,
            'net_profit'    => (float) $netProfit,
            'margin_pct'    => $margin,
            'monthly_trend' => $trend,
        ]);
    }

    // Balance Sheet: Assets side (cash + receivables + equipment) vs Liabilities + Equity
    public function balanceSheet(Request $request): JsonResponse
    {
        $asOf = $request->get('as_of', now()->toDateString());

        $totalRevenue = (float) Transaction::revenue()->whereDate('transaction_date', '<=', $asOf)->sum('amount');
        $totalExpense = (float) Transaction::expense()->whereDate('transaction_date', '<=', $asOf)->sum('amount');
        $cash         = $totalRevenue - $totalExpense;

        $unpaidInvoices = (float) Invoice::whereIn('status', ['sent', 'overdue'])
            ->whereDate('issue_date', '<=', $asOf)->sum('total');

        $assets = Asset::where('is_active', true)->get();
        $totalNbv = $assets->sum(fn($a) => $a->netBookValue());

        $totalAssets  = $cash + $unpaidInvoices + $totalNbv;
        $retainedEarnings = $cash; // simplified: cash IS retained earnings for sole-owner

        return response()->json([
            'as_of' => $asOf,
            'assets' => [
                'current' => [
                    ['name' => 'Kas & Bank',              'amount' => round($cash, 2)],
                    ['name' => 'Piutang Usaha',           'amount' => round($unpaidInvoices, 2)],
                ],
                'fixed' => $assets->map(fn($a) => [
                    'name'   => $a->name,
                    'cost'   => (float) $a->purchase_cost,
                    'accum'  => round($a->accumulatedDepreciation(), 2),
                    'amount' => round($a->netBookValue(), 2),
                ])->values(),
                'total' => round($totalAssets, 2),
            ],
            'liabilities_equity' => [
                'liabilities' => [],   // no liability tracking yet
                'equity' => [
                    ['name' => 'Modal & Laba Ditahan', 'amount' => round($retainedEarnings, 2)],
                    ['name' => 'Aset Tetap (NBV)',     'amount' => round($totalNbv, 2)],
                ],
                'total' => round($totalAssets, 2),
            ],
        ]);
    }

    // Cash Flow Statement: operating, investing, financing activities
    public function cashFlow(Request $request): JsonResponse
    {
        $year  = (int) $request->get('year', now()->year);
        $month = $request->get('month');

        $base = Transaction::whereYear('transaction_date', $year);
        if ($month) {
            $base->whereMonth('transaction_date', (int) $month);
        }

        $operating = [
            'inflows'  => (clone $base)->revenue()->selectRaw('category, SUM(amount) as total')->groupBy('category')->get(),
            'outflows' => (clone $base)->expense()
                ->whereNotIn('category', ['Equipment Purchase', 'Asset'])
                ->selectRaw('category, SUM(amount) as total')->groupBy('category')->get(),
        ];
        $netOperating = $operating['inflows']->sum('total') - $operating['outflows']->sum('total');

        $investing = (clone $base)->expense()
            ->whereIn('category', ['Equipment Purchase', 'Asset'])
            ->selectRaw('category, SUM(amount) as total')->groupBy('category')->get();
        $netInvesting = -$investing->sum('total');

        // Monthly breakdown
        $monthly = Transaction::whereYear('transaction_date', $year)
            ->selectRaw('MONTH(transaction_date) as month, type, SUM(amount) as total')
            ->groupBy('month', 'type')
            ->orderBy('month')
            ->get()
            ->groupBy('month')
            ->map(fn($rows) => [
                'revenue' => (float) ($rows->firstWhere('type', 'revenue')?->total ?? 0),
                'expense' => (float) ($rows->firstWhere('type', 'expense')?->total ?? 0),
                'net'     => (float) ($rows->firstWhere('type', 'revenue')?->total ?? 0)
                           - (float) ($rows->firstWhere('type', 'expense')?->total ?? 0),
            ]);

        return response()->json([
            'year'          => $year,
            'month'         => $month,
            'operating'     => $operating,
            'net_operating' => round($netOperating, 2),
            'investing'     => $investing,
            'net_investing' => round($netInvesting, 2),
            'net_cash'      => round($netOperating + $netInvesting, 2),
            'monthly'       => $monthly,
        ]);
    }

    // Unit Economics: per-event metrics (wedding, corporate, etc.)
    public function unitEconomics(Request $request): JsonResponse
    {
        $year = (int) $request->get('year', now()->year);

        // Revenue per event type from invoices
        $byType = Invoice::whereYear('issue_date', $year)
            ->where('status', 'paid')
            ->selectRaw('event_type, COUNT(*) as count, SUM(total) as revenue, AVG(total) as avg_revenue')
            ->groupBy('event_type')
            ->get();

        // Overall from transactions
        $totalRevenue = (float) Transaction::revenue()->whereYear('transaction_date', $year)->sum('amount');
        $totalExpense = (float) Transaction::expense()->whereYear('transaction_date', $year)->sum('amount');
        $totalEvents  = Invoice::whereYear('issue_date', $year)->where('status', 'paid')->count();

        $avgRevPerEvent = $totalEvents > 0 ? $totalRevenue / $totalEvents : 0;

        // Top expense categories
        $topExpenses = Transaction::expense()->whereYear('transaction_date', $year)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json([
            'year'               => $year,
            'revenue_by_type'    => $byType,
            'total_revenue'      => $totalRevenue,
            'total_expense'      => $totalExpense,
            'net_profit'         => $totalRevenue - $totalExpense,
            'total_paid_events'  => $totalEvents,
            'avg_rev_per_event'  => round($avgRevPerEvent, 2),
            'top_expenses'       => $topExpenses,
        ]);
    }
}
