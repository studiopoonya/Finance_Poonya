<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Asset extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'category', 'purchase_date', 'purchase_cost',
        'useful_life_years', 'salvage_value', 'serial_number', 'notes', 'is_active',
    ];

    protected $casts = [
        'purchase_date'     => 'date',
        'purchase_cost'     => 'decimal:2',
        'salvage_value'     => 'decimal:2',
        'useful_life_years' => 'integer',
        'is_active'         => 'boolean',
    ];

    public function annualDepreciation(): float
    {
        if ($this->useful_life_years <= 0) return 0;
        return ((float)$this->purchase_cost - (float)$this->salvage_value) / $this->useful_life_years;
    }

    public function accumulatedDepreciation(): float
    {
        $years = $this->purchase_date->diffInYears(now());
        $years = min($years, $this->useful_life_years);
        return $this->annualDepreciation() * $years;
    }

    public function netBookValue(): float
    {
        return max(0, (float)$this->purchase_cost - $this->accumulatedDepreciation());
    }
}
