<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_month', 'period_year', 'tax_type', 'description',
        'base_amount', 'tax_rate', 'tax_amount', 'status', 'paid_at', 'notes',
    ];

    protected $casts = [
        'base_amount'  => 'decimal:2',
        'tax_rate'     => 'decimal:2',
        'tax_amount'   => 'decimal:2',
        'paid_at'      => 'date',
        'period_month' => 'integer',
        'period_year'  => 'integer',
    ];
}
