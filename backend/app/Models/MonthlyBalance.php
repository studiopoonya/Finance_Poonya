<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MonthlyBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_month', 'period_year', 'account_code', 'account_name',
        'debit', 'credit', 'sort_order', 'notes',
    ];

    protected $casts = [
        'debit'        => 'decimal:2',
        'credit'       => 'decimal:2',
        'period_month' => 'integer',
        'period_year'  => 'integer',
        'sort_order'   => 'integer',
    ];
}
