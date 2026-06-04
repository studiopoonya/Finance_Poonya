<?php

namespace Database\Seeders;

use App\Models\BankAccount;
use Illuminate\Database\Seeder;

class BankAccountSeeder extends Seeder
{
    public function run(): void
    {
        // Only seed if table is empty
        if (BankAccount::count() > 0) return;

        $accounts = [
            // ── LINE BANK sub-accounts ────────────────────────────────────────
            ['bank_name' => 'line_bank', 'internal_code' => '16451859791', 'account_number' => '10071881879', 'account_name' => 'Angel Investor', 'sort_order' => 1],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859792', 'account_number' => '10071879556', 'account_name' => 'Marketing',      'sort_order' => 2],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859793', 'account_number' => null,          'account_name' => 'Poonya Box',      'sort_order' => 3],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859794', 'account_number' => null,          'account_name' => 'Poonya Moments',  'sort_order' => 4],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859795', 'account_number' => '10071880473', 'account_name' => 'Subscription',    'sort_order' => 5],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859795', 'account_number' => '10071881283', 'account_name' => 'Tabungan',         'sort_order' => 6],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859795', 'account_number' => '10071879769', 'account_name' => 'Maintenance',      'sort_order' => 7],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859795', 'account_number' => '10071881526', 'account_name' => 'Training',         'sort_order' => 8],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859795', 'account_number' => '10071881372', 'account_name' => 'Entertain',        'sort_order' => 9],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859796', 'account_number' => '10071879246', 'account_name' => 'Dana Darurat',     'sort_order' => 10],
            ['bank_name' => 'line_bank', 'internal_code' => '16451859797', 'account_number' => '10071880082', 'account_name' => 'Charity',          'sort_order' => 11],

            // ── SAQU Bank sub-accounts ────────────────────────────────────────
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071879246', 'account_name' => 'Dana Darurat',    'sort_order' => 1],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071879556', 'account_name' => 'Marketing',       'sort_order' => 2],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071879769', 'account_name' => 'Maintenance',     'sort_order' => 3],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071880082', 'account_name' => 'Charity',         'sort_order' => 4],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071880473', 'account_name' => 'Subscription',    'sort_order' => 5],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071881283', 'account_name' => 'Tabungan',        'sort_order' => 6],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071881372', 'account_name' => 'Entertain',       'sort_order' => 7],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071881453', 'account_name' => 'Endorsement',     'sort_order' => 8],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071881526', 'account_name' => 'Training',        'sort_order' => 9],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071881879', 'account_name' => 'Angel Investor',  'sort_order' => 10],
            ['bank_name' => 'saqu', 'internal_code' => null, 'account_number' => '10071883286', 'account_name' => 'Nabung Ruko',     'sort_order' => 11],
        ];

        foreach ($accounts as $acc) {
            BankAccount::create(array_merge($acc, ['is_active' => true]));
        }
    }
}
