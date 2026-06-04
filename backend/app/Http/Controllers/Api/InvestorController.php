<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Investor;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvestorController extends Controller
{
    public function index(): JsonResponse
    {
        $investors = Investor::orderBy('created_at', 'desc')->get();

        $totalRevenue = Transaction::revenue()->sum('amount');
        $totalExpense = Transaction::expense()->sum('amount');
        $netProfit    = $totalRevenue - $totalExpense;

        $summary = [
            'total_invested'   => (float) $investors->sum('investment_amount'),
            'active_count'     => $investors->where('status', 'active')->count(),
            'total_count'      => $investors->count(),
            'total_equity_pct' => (float) $investors->where('status', 'active')->sum('equity_percentage'),
            'net_profit'       => (float) $netProfit,
        ];

        return response()->json([
            'investors' => $investors,
            'summary'   => $summary,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'nullable|email|max:255|unique:investors,email',
            'company'           => 'nullable|string|max:255',
            'investment_amount' => 'required|numeric|min:0',
            'investment_date'   => 'nullable|date',
            'equity_percentage' => 'nullable|numeric|min:0|max:100',
            'status'            => ['nullable', Rule::in(['active', 'exited', 'pending'])],
            'notes'             => 'nullable|string',
        ]);

        $investor = Investor::create($data);

        return response()->json($investor, 201);
    }

    public function show(Investor $investor): JsonResponse
    {
        return response()->json($investor->load('transactions'));
    }

    public function update(Request $request, Investor $investor): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'email'             => ['nullable', 'email', 'max:255', Rule::unique('investors', 'email')->ignore($investor->id)],
            'company'           => 'nullable|string|max:255',
            'investment_amount' => 'sometimes|numeric|min:0',
            'investment_date'   => 'nullable|date',
            'equity_percentage' => 'nullable|numeric|min:0|max:100',
            'status'            => ['sometimes', Rule::in(['active', 'exited', 'pending'])],
            'notes'             => 'nullable|string',
        ]);

        $investor->update($data);

        return response()->json($investor);
    }

    public function destroy(Investor $investor): JsonResponse
    {
        $investor->delete();

        return response()->json(['message' => 'Investor berhasil dihapus.']);
    }
}
