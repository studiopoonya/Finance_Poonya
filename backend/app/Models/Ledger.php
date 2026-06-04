<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ledger extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_label', 'period_start', 'period_end',
        'total_revenue', 'total_expenses', 'total_investment',
        'roi_percentage', 'burn_rate', 'is_finalized',
    ];

    protected $casts = [
        'period_start'    => 'date',
        'period_end'      => 'date',
        'total_revenue'   => 'decimal:2',
        'total_expenses'  => 'decimal:2',
        'net_profit'      => 'decimal:2',
        'total_investment'=> 'decimal:2',
        'roi_percentage'  => 'decimal:2',
        'burn_rate'       => 'decimal:2',
        'is_finalized'    => 'boolean',
    ];
}
