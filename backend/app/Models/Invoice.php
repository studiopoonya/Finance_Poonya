<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number', 'client_name', 'client_email', 'client_phone',
        'event_type', 'event_date', 'issue_date', 'due_date',
        'subtotal', 'tax_rate', 'tax_amount', 'total',
        'status', 'notes', 'paid_at',
    ];

    protected $casts = [
        'event_date'  => 'date',
        'issue_date'  => 'date',
        'due_date'    => 'date',
        'paid_at'     => 'datetime',
        'subtotal'    => 'decimal:2',
        'tax_rate'    => 'decimal:2',
        'tax_amount'  => 'decimal:2',
        'total'       => 'decimal:2',
    ];

    public function items()
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('sort_order');
    }
}
