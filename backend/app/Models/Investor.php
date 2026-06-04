<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Investor extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'email', 'company', 'investment_amount',
        'investment_date', 'equity_percentage', 'status', 'notes',
    ];

    protected $casts = [
        'investment_amount'  => 'decimal:2',
        'equity_percentage'  => 'decimal:2',
        'investment_date'    => 'date',
    ];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
