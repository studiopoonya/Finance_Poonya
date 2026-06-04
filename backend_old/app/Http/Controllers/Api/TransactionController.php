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
        $query = Transaction::with('investor')->latest('transaction_date');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }
        if ($request->filled('from')) {
            $query->where('transaction_date', '>=', $request->from);
        }
        if ($request->filled('to')) {
            $query->where('transaction_date', '<=', $request->to);
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'transaction_date' => 'required|date',
            'merchant'         => 'required|string|max:255',
            'amount'           => 'required|numeric|min:0.01',
            'type'             => ['required', Rule::in(['revenue', 'expense'])],
            'category'         => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'investor_id'      => 'nullable|exists:investors,id',
            'ai_verified'      => 'boolean',
            'ai_confidence'    => 'nullable|numeric|min:0|max:1',
            'ai_raw_response'  => 'nullable|array',
        ]);

        $transaction = Transaction::create($data);

        return response()->json($transaction, 201);
    }

    public function show(Transaction $transaction): JsonResponse
    {
        return response()->json($transaction->load('investor'));
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $data = $request->validate([
            'transaction_date' => 'sometimes|date',
            'merchant'         => 'sometimes|string|max:255',
            'amount'           => 'sometimes|numeric|min:0.01',
            'type'             => ['sometimes', Rule::in(['revenue', 'expense'])],
            'category'         => 'nullable|string|max:100',
            'notes'            => 'nullable|string',
            'ai_verified'      => 'boolean',
        ]);

        $transaction->update($data);

        return response()->json($transaction);
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        $transaction->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
