<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvoiceController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Invoice::with('items')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $s = '%' . $request->search . '%';
            $query->where(fn($q) => $q->where('client_name', 'like', $s)->orWhere('invoice_number', 'like', $s));
        }

        $invoices = $query->paginate(15);

        $summary = [
            'total_invoiced' => (float) Invoice::whereNotIn('status', ['cancelled'])->sum('total'),
            'total_paid'     => (float) Invoice::where('status', 'paid')->sum('total'),
            'total_pending'  => (float) Invoice::whereIn('status', ['sent', 'overdue'])->sum('total'),
            'overdue_count'  => Invoice::where('status', 'overdue')->count(),
        ];

        return response()->json(['invoices' => $invoices, 'summary' => $summary]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'client_name'  => 'required|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'event_type'   => ['nullable', Rule::in(['wedding', 'corporate', 'social', 'birthday', 'other'])],
            'event_date'   => 'nullable|date',
            'issue_date'   => 'required|date',
            'due_date'     => 'required|date|after_or_equal:issue_date',
            'tax_rate'     => 'nullable|numeric|min:0|max:100',
            'status'       => ['nullable', Rule::in(['draft', 'sent', 'paid', 'overdue', 'cancelled'])],
            'notes'        => 'nullable|string',
            'items'        => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity'    => 'required|numeric|min:0',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.sort_order'  => 'nullable|integer',
        ]);

        $data['invoice_number'] = $this->generateNumber();
        $data['status']         = $data['status'] ?? 'draft';
        $data['tax_rate']       = $data['tax_rate'] ?? 0;

        [$subtotal, $taxAmount, $total] = $this->calcTotals($data['items'], (float) $data['tax_rate']);
        $data['subtotal']   = $subtotal;
        $data['tax_amount'] = $taxAmount;
        $data['total']      = $total;

        $invoice = Invoice::create($data);
        $this->syncItems($invoice, $data['items']);

        return response()->json($invoice->load('items'), 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json($invoice->load('items'));
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validate([
            'client_name'  => 'sometimes|string|max:255',
            'client_email' => 'nullable|email|max:255',
            'client_phone' => 'nullable|string|max:50',
            'event_type'   => ['nullable', Rule::in(['wedding', 'corporate', 'social', 'birthday', 'other'])],
            'event_date'   => 'nullable|date',
            'issue_date'   => 'sometimes|date',
            'due_date'     => 'sometimes|date',
            'tax_rate'     => 'nullable|numeric|min:0|max:100',
            'status'       => ['sometimes', Rule::in(['draft', 'sent', 'paid', 'overdue', 'cancelled'])],
            'notes'        => 'nullable|string',
            'paid_at'      => 'nullable|date',
            'items'        => 'sometimes|array|min:1',
            'items.*.description' => 'required_with:items|string|max:255',
            'items.*.quantity'    => 'required_with:items|numeric|min:0',
            'items.*.unit_price'  => 'required_with:items|numeric|min:0',
            'items.*.sort_order'  => 'nullable|integer',
        ]);

        if (isset($data['status']) && $data['status'] === 'paid' && !$invoice->paid_at) {
            $data['paid_at'] = now();
        }

        if (isset($data['items'])) {
            $taxRate = (float) ($data['tax_rate'] ?? $invoice->tax_rate);
            [$subtotal, $taxAmount, $total] = $this->calcTotals($data['items'], $taxRate);
            $data['subtotal']   = $subtotal;
            $data['tax_amount'] = $taxAmount;
            $data['total']      = $total;
        }

        $invoice->update($data);

        if (isset($data['items'])) {
            $this->syncItems($invoice, $data['items']);
        }

        return response()->json($invoice->load('items'));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        $invoice->items()->delete();
        $invoice->delete();

        return response()->json(['message' => 'Invoice berhasil dihapus.']);
    }

    private function generateNumber(): string
    {
        $prefix = 'INV-' . now()->format('Ym') . '-';
        $last   = Invoice::where('invoice_number', 'like', $prefix . '%')
            ->orderByDesc('invoice_number')->value('invoice_number');
        $seq = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix . str_pad($seq, 4, '0', STR_PAD_LEFT);
    }

    private function calcTotals(array $items, float $taxRate): array
    {
        $subtotal  = collect($items)->sum(fn($i) => (float) $i['quantity'] * (float) $i['unit_price']);
        $taxAmount = $subtotal * $taxRate / 100;
        return [$subtotal, $taxAmount, $subtotal + $taxAmount];
    }

    private function syncItems(Invoice $invoice, array $items): void
    {
        $invoice->items()->delete();
        foreach ($items as $idx => $item) {
            $invoice->items()->create([
                'description' => $item['description'],
                'quantity'    => $item['quantity'],
                'unit_price'  => $item['unit_price'],
                'amount'      => (float) $item['quantity'] * (float) $item['unit_price'],
                'sort_order'  => $item['sort_order'] ?? $idx,
            ]);
        }
    }
}
