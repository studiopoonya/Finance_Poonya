<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TaxRecord::query();

        if ($request->filled('year')) {
            $query->where('period_year', (int) $request->year);
        }
        if ($request->filled('month')) {
            $query->where('period_month', (int) $request->month);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('tax_type')) {
            $query->where('tax_type', $request->tax_type);
        }

        $records = $query->orderBy('period_year', 'desc')->orderBy('period_month', 'desc')->get();

        $summary = [
            'total_tax'   => (float) $records->sum('tax_amount'),
            'pending_tax' => (float) $records->where('status', 'pending')->sum('tax_amount'),
            'paid_tax'    => (float) $records->where('status', 'paid')->sum('tax_amount'),
            'pending_count' => $records->where('status', 'pending')->count(),
        ];

        return response()->json(['records' => $records, 'summary' => $summary]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period_month' => 'required|integer|min:1|max:12',
            'period_year'  => 'required|integer|min:2000|max:2100',
            'tax_type'     => ['required', Rule::in(['pph23', 'ppn_out', 'ppn_in', 'pph25', 'pph21'])],
            'description'  => 'required|string|max:255',
            'base_amount'  => 'required|numeric|min:0',
            'tax_rate'     => 'required|numeric|min:0|max:100',
            'status'       => ['nullable', Rule::in(['pending', 'paid'])],
            'paid_at'      => 'nullable|date',
            'notes'        => 'nullable|string',
        ]);

        $data['tax_amount'] = round((float) $data['base_amount'] * (float) $data['tax_rate'] / 100, 2);
        $data['status']     = $data['status'] ?? 'pending';

        $record = TaxRecord::create($data);

        return response()->json($record, 201);
    }

    public function show(TaxRecord $taxRecord): JsonResponse
    {
        return response()->json($taxRecord);
    }

    public function update(Request $request, TaxRecord $taxRecord): JsonResponse
    {
        $data = $request->validate([
            'period_month' => 'sometimes|integer|min:1|max:12',
            'period_year'  => 'sometimes|integer|min:2000|max:2100',
            'tax_type'     => ['sometimes', Rule::in(['pph23', 'ppn_out', 'ppn_in', 'pph25', 'pph21'])],
            'description'  => 'sometimes|string|max:255',
            'base_amount'  => 'sometimes|numeric|min:0',
            'tax_rate'     => 'sometimes|numeric|min:0|max:100',
            'status'       => ['sometimes', Rule::in(['pending', 'paid'])],
            'paid_at'      => 'nullable|date',
            'notes'        => 'nullable|string',
        ]);

        if (isset($data['base_amount']) || isset($data['tax_rate'])) {
            $base = $data['base_amount'] ?? (float) $taxRecord->base_amount;
            $rate = $data['tax_rate']   ?? (float) $taxRecord->tax_rate;
            $data['tax_amount'] = round($base * $rate / 100, 2);
        }

        if (isset($data['status']) && $data['status'] === 'paid' && !$taxRecord->paid_at) {
            $data['paid_at'] = now()->toDateString();
        }

        $taxRecord->update($data);

        return response()->json($taxRecord);
    }

    public function destroy(TaxRecord $taxRecord): JsonResponse
    {
        $taxRecord->delete();

        return response()->json(['message' => 'Catatan pajak berhasil dihapus.']);
    }
}
