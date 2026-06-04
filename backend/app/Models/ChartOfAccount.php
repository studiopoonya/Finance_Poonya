<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    protected $table = 'chart_of_accounts';

    protected $fillable = [
        'code', 'name', 'account_level', 'statement_type', 'normal_balance',
        'report_category', 'parent_code', 'maps_to_category',
        'is_active', 'description', 'sort_order',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function parent()
    {
        return $this->belongsTo(ChartOfAccount::class, 'parent_code', 'code');
    }

    public function children()
    {
        return $this->hasMany(ChartOfAccount::class, 'parent_code', 'code')->orderBy('sort_order');
    }

    /** Total transaction amount mapped to this account via category. */
    public function getTransactionTotalAttribute(): float
    {
        if (!$this->maps_to_category) return 0;
        return (float) Transaction::where('category', $this->maps_to_category)->sum('amount');
    }

    public static function tree(): array
    {
        $all = static::orderBy('sort_order')->get()->keyBy('code');
        $roots = [];

        foreach ($all as $account) {
            if (!$account->parent_code) {
                $roots[] = $account;
            } else {
                $parent = $all->get($account->parent_code);
                if ($parent) {
                    $parent->_children[] = $account;
                }
            }
        }

        return $roots;
    }
}
