<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'transaction_date', 'merchant', 'amount', 'type', 'category', 'sub_category',
        'payment_method', 'bank_account_id',
        'client_name', 'event_type', 'event_date', 'reference_number',
        'notes', 'receipt_image_path', 'ai_raw_response', 'ai_confidence',
        'ai_verified', 'investor_id',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'event_date'       => 'date',
        'amount'           => 'decimal:2',
        'ai_confidence'    => 'decimal:2',
        'ai_raw_response'  => 'array',
        'ai_verified'      => 'boolean',
    ];

    public function investor()
    {
        return $this->belongsTo(Investor::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(\App\Models\BankAccount::class);
    }

    public function scopeRevenue($query)
    {
        return $query->where('type', 'revenue');
    }

    public function scopeExpense($query)
    {
        return $query->where('type', 'expense');
    }
}
