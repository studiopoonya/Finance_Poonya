<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['investor', 'bankAccount'])->latest('transaction_date');

        if ($request->filled('type'))            $query->where('type', $request->type);
        if ($request->filled('category'))        $query->where('category', $request->category);
        if ($request->filled('payment_method'))  $query->where('payment_method', $request->payment_method);
        if ($request->filled('bank_account_id')) $query->where('bank_account_id', $request->bank_account_id);
        if ($request->filled('event_type'))      $query->where('event_type', $request->event_type);
        if ($request->filled('from'))            $query->where('transaction_date', '>=', $request->from);
        if ($request->filled('to'))              $query->where('transaction_date', '<=', $request->to);
        if ($request->filled('month'))           $query->whereMonth('transaction_date', $request->month);
        if ($request->filled('year'))            $query->whereYear('transaction_date', $request->year);
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(fn($q) => $q->where('merchant', 'like', $s)
                ->orWhere('client_name', 'like', $s)
                ->orWhere('reference_number', 'like', $s)
                ->orWhere('notes', 'like', $s));
        }

        $paginated = $query->paginate((int) $request->get('per_page', 20));

        // Summary stats for the current filter
        $baseQuery = Transaction::query();
        if ($request->filled('month')) $baseQuery->whereMonth('transaction_date', $request->month);
        if ($request->filled('year'))  $baseQuery->whereYear('transaction_date', $request->year);
        if ($request->filled('from'))  $baseQuery->where('transaction_date', '>=', $request->from);
        if ($request->filled('to'))    $baseQuery->where('transaction_date', '<=', $request->to);

        $summary = [
            'total_revenue' => (float) (clone $baseQuery)->revenue()->sum('amount'),
            'total_expense' => (float) (clone $baseQuery)->expense()->sum('amount'),
            'count_revenue' => (clone $baseQuery)->revenue()->count(),
            'count_expense' => (clone $baseQuery)->expense()->count(),
        ];
        $summary['net'] = $summary['total_revenue'] - $summary['total_expense'];

        // Category breakdown
        $breakdown = (clone $baseQuery)
            ->selectRaw('type, category, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('type', 'category')
            ->orderBy('type')->orderByDesc('total')
            ->get();

        return response()->json([
            'transactions' => $paginated,
            'summary'      => $summary,
            'breakdown'    => $breakdown,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transaction_date' => 'required|date',
            'merchant'         => 'required|string|max:255',
            'amount'           => 'required|numeric|min:0',
            'type'             => ['required', Rule::in(['revenue', 'expense'])],
            'category'         => 'nullable|string|max:100',
            'sub_category'     => 'nullable|string|max:100',
            'payment_method'   => 'nullable|string|max:30',
            'bank_account_id'  => 'nullable|exists:bank_accounts,id',
            'client_name'      => 'nullable|string|max:255',
            'event_type'       => ['nullable', Rule::in(['wedding', 'corporate', 'birthday', 'social', 'other'])],
            'event_date'       => 'nullable|date',
            'reference_number' => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'investor_id'      => 'nullable|exists:investors,id',
            'ai_verified'      => 'boolean',
            'ai_confidence'    => 'nullable|numeric|min:0|max:1',
            'ai_raw_response'  => 'nullable|array',
        ]);

        $transaction = Transaction::create($data);

        return response()->json($transaction->load('bankAccount'), 201);
    }

    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json($transaction->load(['investor', 'bankAccount']));
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $data = $request->validate([
            'transaction_date' => 'sometimes|date',
            'merchant'         => 'sometimes|string|max:255',
            'amount'           => 'sometimes|numeric|min:0',
            'type'             => ['sometimes', Rule::in(['revenue', 'expense'])],
            'category'         => 'nullable|string|max:100',
            'sub_category'     => 'nullable|string|max:100',
            'payment_method'   => 'nullable|string|max:30',
            'bank_account_id'  => 'nullable|exists:bank_accounts,id',
            'client_name'      => 'nullable|string|max:255',
            'event_type'       => ['nullable', Rule::in(['wedding', 'corporate', 'birthday', 'social', 'other'])],
            'event_date'       => 'nullable|date',
            'reference_number' => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'ai_verified'      => 'boolean',
        ]);

        $transaction->update($data);

        return response()->json($transaction->load('bankAccount'));
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        $transaction->delete();
        return response()->json(['message' => 'Transaksi berhasil dihapus.']);
    }
}
