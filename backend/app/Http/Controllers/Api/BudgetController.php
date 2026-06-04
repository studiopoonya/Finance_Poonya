<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BudgetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $year  = (int) $request->get('year', now()->year);
        $month = $request->get('month');

        $query = Budget::where('year', $year);
        if ($month) {
            $query->where('month', (int) $month);
        }

        $budgets = $query->orderBy('month')->orderBy('type')->orderBy('category')->get();

        // Fetch actual spending from transactions for the same period
        $txQuery = Transaction::whereYear('transaction_date', $year);
        if ($month) {
            $txQuery->whereMonth('transaction_date', (int) $month);
        }
        $actuals = $txQuery->selectRaw('type, category, SUM(amount) as actual')
            ->groupBy('type', 'category')
            ->get()
            ->keyBy(fn($r) => "{$r->type}_{$r->category}");

        $rows = $budgets->map(function ($b) use ($actuals) {
            $key    = "{$b->type}_{$b->category}";
            $actual = isset($actuals[$key]) ? (float) $actuals[$key]->actual : 0.0;
            $budget = (float) $b->amount;
            $variance = $b->type === 'revenue'
                ? $actual - $budget          // positive = exceeded budget (good)
                : $budget - $actual;         // positive = under budget (good)
            return array_merge($b->toArray(), [
                'actual'           => $actual,
                'variance'         => $variance,
                'variance_pct'     => $budget > 0 ? round($variance / $budget * 100, 1) : null,
            ]);
        });

        return response()->json(['data' => $rows, 'year' => $year, 'month' => $month]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'month'    => 'required|integer|min:1|max:12',
            'year'     => 'required|integer|min:2000|max:2100',
            'category' => 'required|string|max:100',
            'type'     => ['required', Rule::in(['revenue', 'expense'])],
            'amount'   => 'required|numeric|min:0',
            'notes'    => 'nullable|string',
        ]);

        $budget = Budget::updateOrCreate(
            ['month' => $data['month'], 'year' => $data['year'], 'category' => $data['category'], 'type' => $data['type']],
            ['amount' => $data['amount'], 'notes' => $data['notes'] ?? null]
        );

        return response()->json($budget, 201);
    }

    public function update(Request $request, Budget $budget): JsonResponse
    {
        $data = $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'notes'  => 'nullable|string',
        ]);

        $budget->update($data);

        return response()->json($budget);
    }

    public function destroy(Budget $budget): JsonResponse
    {
        $budget->delete();

        return response()->json(['message' => 'Budget berhasil dihapus.']);
    }

    // Cash runway: cash_balance / avg_monthly_burn
    public function cashRunway(): JsonResponse
    {
        $cash = (float) Transaction::revenue()->sum('amount') - (float) Transaction::expense()->sum('amount');

        // Average monthly burn over last 3 months
        $burn = Transaction::expense()
            ->where('transaction_date', '>=', now()->subMonths(3)->startOfMonth())
            ->selectRaw('YEAR(transaction_date) y, MONTH(transaction_date) m, SUM(amount) total')
            ->groupBy('y', 'm')
            ->get();

        $avgBurn = $burn->count() > 0 ? $burn->avg('total') : 0;
        $months  = $avgBurn > 0 ? round($cash / $avgBurn, 1) : null;

        return response()->json([
            'cash_balance'       => $cash,
            'avg_monthly_burn'   => round($avgBurn, 2),
            'runway_months'      => $months,
        ]);
    }
}
