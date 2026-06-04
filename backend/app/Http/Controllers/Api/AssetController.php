<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AssetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Asset::query();

        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        $assets = $query->orderBy('purchase_date', 'desc')->get()->map(fn($a) => $this->withDepreciation($a));

        $summary = [
            'total_cost'    => $assets->sum('purchase_cost'),
            'total_nbv'     => $assets->sum('net_book_value'),
            'total_accum'   => $assets->sum('accumulated_depreciation'),
            'active_count'  => $assets->where('is_active', true)->count(),
        ];

        return response()->json(['assets' => $assets, 'summary' => $summary]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'required|string|max:255',
            'category'          => 'nullable|string|max:100',
            'purchase_date'     => 'required|date',
            'purchase_cost'     => 'required|numeric|min:0',
            'useful_life_years' => 'nullable|integer|min:1|max:50',
            'salvage_value'     => 'nullable|numeric|min:0',
            'serial_number'     => 'nullable|string|max:100',
            'notes'             => 'nullable|string',
            'is_active'         => 'nullable|boolean',
        ]);

        $asset = Asset::create($data);

        return response()->json($this->withDepreciation($asset), 201);
    }

    public function show(Asset $asset): JsonResponse
    {
        return response()->json($this->withDepreciation($asset));
    }

    public function update(Request $request, Asset $asset): JsonResponse
    {
        $data = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'category'          => 'nullable|string|max:100',
            'purchase_date'     => 'sometimes|date',
            'purchase_cost'     => 'sometimes|numeric|min:0',
            'useful_life_years' => 'nullable|integer|min:1|max:50',
            'salvage_value'     => 'nullable|numeric|min:0',
            'serial_number'     => 'nullable|string|max:100',
            'notes'             => 'nullable|string',
            'is_active'         => 'nullable|boolean',
        ]);

        $asset->update($data);
        $asset->refresh();

        return response()->json($this->withDepreciation($asset));
    }

    public function destroy(Asset $asset): JsonResponse
    {
        $asset->delete();

        return response()->json(['message' => 'Aset berhasil dihapus.']);
    }

    private function withDepreciation(Asset $asset): array
    {
        $data                             = $asset->toArray();
        $data['annual_depreciation']      = round($asset->annualDepreciation(), 2);
        $data['accumulated_depreciation'] = round($asset->accumulatedDepreciation(), 2);
        $data['net_book_value']           = round($asset->netBookValue(), 2);
        return $data;
    }
}
