<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\Ledger;
use App\Models\Transaction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $now          = Carbon::now();
        $monthStart   = $now->copy()->startOfMonth();
        $monthEnd     = $now->copy()->endOfMonth();
        $prevStart    = $now->copy()->subMonth()->startOfMonth();
        $prevEnd      = $now->copy()->subMonth()->endOfMonth();

        // ── Current month aggregates ──────────────────────────────────────────
        $currRevenue  = Transaction::revenue()->whereBetween('transaction_date', [$monthStart, $monthEnd])->sum('amount');
        $currExpenses = Transaction::expense()->whereBetween('transaction_date', [$monthStart, $monthEnd])->sum('amount');
        $currNet      = $currRevenue - $currExpenses;

        // ── Previous month (for % change) ────────────────────────────────────
        $prevRevenue  = Transaction::revenue()->whereBetween('transaction_date', [$prevStart, $prevEnd])->sum('amount');
        $prevExpenses = Transaction::expense()->whereBetween('transaction_date', [$prevStart, $prevEnd])->sum('amount');

        // ── Investor KPIs ─────────────────────────────────────────────────────
        $totalInvested = Investor::where('status', 'active')->sum('investment_amount');
        $allTimeNet    = Transaction::revenue()->sum('amount') - Transaction::expense()->sum('amount');
        $roi           = $totalInvested > 0 ? round(($allTimeNet / $totalInvested) * 100, 2) : 0;

        // ── Burn rate (avg daily expense × 30) ───────────────────────────────
        $daysElapsed   = max($now->dayOfMonth, 1);
        $burnRate      = round(($currExpenses / $daysElapsed) * 30, 2);

        // ── Expense breakdown by category (current month) ─────────────────────
        $expenseBreakdown = Transaction::expense()
            ->whereBetween('transaction_date', [$monthStart, $monthEnd])
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        // ── 6-month revenue & expense trend ──────────────────────────────────
        $trend = collect(range(5, 0))->map(function ($m) use ($now) {
            $start = $now->copy()->subMonths($m)->startOfMonth();
            $end   = $start->copy()->endOfMonth();

            return [
                'month'    => $start->format('M Y'),
                'revenue'  => (float) Transaction::revenue()->whereBetween('transaction_date', [$start, $end])->sum('amount'),
                'expenses' => (float) Transaction::expense()->whereBetween('transaction_date', [$start, $end])->sum('amount'),
            ];
        })->values();

        // ── Recent transactions ───────────────────────────────────────────────
        $recent = Transaction::latest('transaction_date')
            ->limit(8)
            ->get(['id', 'transaction_date', 'merchant', 'amount', 'type', 'category', 'ai_verified']);

        return response()->json([
            'kpis' => [
                'total_revenue'    => (float) $currRevenue,
                'total_expenses'   => (float) $currExpenses,
                'net_profit'       => (float) $currNet,
                'burn_rate'        => (float) $burnRate,
                'roi'              => $roi,
                'total_invested'   => (float) $totalInvested,
                'revenue_change'   => $this->pctChange($prevRevenue, $currRevenue),
                'expenses_change'  => $this->pctChange($prevExpenses, $currExpenses),
            ],
            'trend'             => $trend,
            'expense_breakdown' => $expenseBreakdown,
            'recent'            => $recent,
        ]);
    }

    public function ledgers(): JsonResponse
    {
        return response()->json(
            Ledger::orderByDesc('period_start')->limit(12)->get()
        );
    }

    private function pctChange(float $prev, float $curr): float
    {
        if ($prev == 0) return $curr > 0 ? 100 : 0;
        return round((($curr - $prev) / abs($prev)) * 100, 2);
    }
}
