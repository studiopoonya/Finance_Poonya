<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // ════════════════════════════════════════════════════════
            // NERACA — ASET
            // ════════════════════════════════════════════════════════
            ['code' => '1000', 'name' => 'ASET',              'level' => 'group',    'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => null,   'sort' => 10],
            ['code' => '1100', 'name' => 'Aset Lancar',       'level' => 'subgroup', 'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => '1000', 'sort' => 11],
            ['code' => '1101', 'name' => 'Kas Bank – BCA',    'level' => 'detail',   'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => '1100', 'sort' => 12, 'desc' => 'Rekening operasional utama PT (BCA)'],
            ['code' => '1102', 'name' => 'Kas Bank – Line Bank','level'=> 'detail',  'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => '1100', 'sort' => 13],
            ['code' => '1103', 'name' => 'Kas Bank – Saqu',   'level' => 'detail',   'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => '1100', 'sort' => 14, 'desc' => 'Rekening tabungan/float'],
            ['code' => '1104', 'name' => 'Persediaan',        'level' => 'detail',   'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => '1100', 'sort' => 15, 'desc' => 'Stok supplies: film, cetak, backdrop', 'maps' => 'Supplies'],
            ['code' => '1105', 'name' => 'Piutang Usaha',     'level' => 'detail',   'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => '1100', 'sort' => 16, 'desc' => 'Invoice yang belum dibayar klien'],
            ['code' => '1106', 'name' => 'Sewa Dibayar Dimuka','level'=> 'detail',   'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'current_asset',   'parent' => '1100', 'sort' => 17, 'desc' => 'Prepaid rent — diamortisasi tiap bulan'],

            ['code' => '1200', 'name' => 'Aset Tetap',        'level' => 'subgroup', 'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'fixed_asset',     'parent' => '1000', 'sort' => 20],
            ['code' => '1201', 'name' => 'Peralatan',         'level' => 'detail',   'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'fixed_asset',     'parent' => '1200', 'sort' => 21, 'desc' => 'Kamera, printer, backdrop, lighting, dll', 'maps' => 'Equipment'],
            ['code' => '1202', 'name' => 'Akm. Penyusutan Peralatan','level'=>'detail','stmt'=> 'balance_sheet',   'balance' => 'credit','cat' => 'fixed_asset',     'parent' => '1200', 'sort' => 22, 'desc' => 'Kontra akun — mengurangi nilai peralatan'],
            ['code' => '1203', 'name' => 'Aset Tak Berwujud', 'level' => 'detail',   'stmt' => 'balance_sheet',    'balance' => 'debit', 'cat' => 'fixed_asset',     'parent' => '1200', 'sort' => 23, 'desc' => 'Software berlisensi, domain, brand IP', 'maps' => 'Software'],
            ['code' => '1204', 'name' => 'Akm. Amortisasi Aset Tak Berwujud','level'=>'detail','stmt'=>'balance_sheet','balance'=>'credit','cat'=>'fixed_asset','parent'=>'1200','sort'=>24],

            // ════════════════════════════════════════════════════════
            // NERACA — KEWAJIBAN
            // ════════════════════════════════════════════════════════
            ['code' => '2000', 'name' => 'KEWAJIBAN',                   'level' => 'group',    'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'current_liability',   'parent' => null,   'sort' => 30],
            ['code' => '2100', 'name' => 'Kewajiban Jangka Pendek',     'level' => 'subgroup', 'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'current_liability',   'parent' => '2000', 'sort' => 31, 'desc' => 'Jatuh tempo < 12 bulan'],
            ['code' => '2101', 'name' => 'Utang Usaha',                 'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'current_liability',   'parent' => '2100', 'sort' => 32, 'desc' => 'Hutang ke vendor / supplier'],
            ['code' => '2102', 'name' => 'Beban yang Masih Harus Dibayar','level'=>'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'current_liability',   'parent' => '2100', 'sort' => 33, 'desc' => 'Accrued expenses — sudah terjadi, belum dibayar'],
            ['code' => '2103', 'name' => 'Utang Gaji',                  'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'current_liability',   'parent' => '2100', 'sort' => 34],
            ['code' => '2104', 'name' => 'Utang Pajak',                 'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'current_liability',   'parent' => '2100', 'sort' => 35, 'desc' => 'PPh 21/23/25 yang belum disetor'],

            ['code' => '2200', 'name' => 'Kewajiban Jangka Panjang',    'level' => 'subgroup', 'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'long_term_liability', 'parent' => '2000', 'sort' => 40, 'desc' => 'Jatuh tempo > 12 bulan'],
            ['code' => '2201', 'name' => 'Utang Sewa Gedung',           'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'long_term_liability', 'parent' => '2200', 'sort' => 41, 'maps' => 'Rent'],
            ['code' => '2202', 'name' => 'Utang kepada Investor',       'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'long_term_liability', 'parent' => '2200', 'sort' => 42, 'desc' => 'Modal pinjaman dari investor (convertible/debt)'],

            // ════════════════════════════════════════════════════════
            // NERACA — EKUITAS
            // ════════════════════════════════════════════════════════
            ['code' => '3000', 'name' => 'EKUITAS',              'level' => 'group',    'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'equity', 'parent' => null,   'sort' => 50],
            ['code' => '3100', 'name' => 'Modal Disetor',        'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'equity', 'parent' => '3000', 'sort' => 51, 'desc' => 'Setoran modal awal + tambahan dari pemilik/investor'],
            ['code' => '3200', 'name' => 'Prive / Dividen',      'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'debit',  'cat' => 'equity', 'parent' => '3000', 'sort' => 52, 'desc' => 'Pengambilan pribadi pemilik (mengurangi ekuitas)'],
            ['code' => '3300', 'name' => 'Laba Ditahan',         'level' => 'detail',   'stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'equity', 'parent' => '3000', 'sort' => 53, 'desc' => 'Retained Earnings — akumulasi laba tahun-tahun sebelumnya'],
            ['code' => '3400', 'name' => 'Laba / Rugi Tahun Berjalan','level'=>'detail','stmt' => 'balance_sheet', 'balance' => 'credit', 'cat' => 'equity', 'parent' => '3000', 'sort' => 54, 'desc' => 'Ditutup ke Laba Ditahan di akhir periode'],

            // ════════════════════════════════════════════════════════
            // LABA RUGI — PENDAPATAN
            // ════════════════════════════════════════════════════════
            ['code' => '4000', 'name' => 'PENDAPATAN',               'level' => 'group',    'stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'revenue', 'parent' => null,   'sort' => 60],
            ['code' => '4001', 'name' => 'Pendapatan Jasa – Wedding', 'level' => 'detail',  'stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'revenue', 'parent' => '4000', 'sort' => 61, 'maps' => 'Event Revenue', 'desc' => 'Sewa photobooth untuk pernikahan'],
            ['code' => '4002', 'name' => 'Pendapatan Jasa – Corporate','level'=> 'detail',  'stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'revenue', 'parent' => '4000', 'sort' => 62, 'desc' => 'Sewa photobooth untuk acara korporat'],
            ['code' => '4003', 'name' => 'Pendapatan Jasa – Social Event','level'=>'detail','stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'revenue', 'parent' => '4000', 'sort' => 63, 'desc' => 'Ulang tahun, wisuda, gathering, dll'],
            ['code' => '4004', 'name' => 'Pendapatan Print & Digital','level' => 'detail',  'stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'revenue', 'parent' => '4000', 'sort' => 64, 'desc' => 'Cetak foto, video reel, digital frame'],

            ['code' => '4100', 'name' => 'Pendapatan Lain-lain',      'level' => 'subgroup','stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'other_income', 'parent' => '4000', 'sort' => 65],
            ['code' => '4101', 'name' => 'Pendapatan Bunga',          'level' => 'detail',  'stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'other_income', 'parent' => '4100', 'sort' => 66],
            ['code' => '4102', 'name' => 'Pendapatan Lain-Lain',      'level' => 'detail',  'stmt' => 'income_statement', 'balance' => 'credit', 'cat' => 'other_income', 'parent' => '4100', 'sort' => 67],

            // ════════════════════════════════════════════════════════
            // LABA RUGI — HPP (COGS) ← BARU, kritis untuk Gross Margin
            // ════════════════════════════════════════════════════════
            ['code' => '5000', 'name' => 'HARGA POKOK PENJUALAN',      'level' => 'group',    'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'cogs', 'parent' => null,   'sort' => 70, 'desc' => 'COGS: biaya langsung menghasilkan revenue'],
            ['code' => '5001', 'name' => 'Tenaga Kerja Event (COGS)',   'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'cogs', 'parent' => '5000', 'sort' => 71, 'maps' => 'Event Staff', 'desc' => 'Operator, fotografer freelance per event'],
            ['code' => '5002', 'name' => 'Biaya Konsumsi Event (COGS)', 'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'cogs', 'parent' => '5000', 'sort' => 72, 'maps' => 'Supplies'],
            ['code' => '5003', 'name' => 'Biaya Transportasi Event',    'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'cogs', 'parent' => '5000', 'sort' => 73, 'maps' => 'Transport', 'desc' => 'Pengiriman peralatan ke venue'],

            // ════════════════════════════════════════════════════════
            // LABA RUGI — BIAYA OPERASIONAL
            // ════════════════════════════════════════════════════════
            ['code' => '6000', 'name' => 'BIAYA OPERASIONAL',          'level' => 'group',    'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => null,   'sort' => 80],

            ['code' => '6100', 'name' => 'Biaya Umum & Administrasi',  'level' => 'subgroup', 'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6000', 'sort' => 81],
            ['code' => '6101', 'name' => 'Biaya Gaji Karyawan Tetap',  'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6100', 'sort' => 82, 'maps' => 'Gaji', 'desc' => 'Gaji bulanan karyawan tetap (bukan freelance event)'],
            ['code' => '6102', 'name' => 'Biaya Sewa Studio/Kantor',   'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6100', 'sort' => 83, 'maps' => 'Rent'],
            ['code' => '6103', 'name' => 'Biaya Administrasi Bank',    'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6100', 'sort' => 84, 'maps' => 'Bank Admin'],
            ['code' => '6104', 'name' => 'Biaya Software & SaaS',      'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6100', 'sort' => 85, 'maps' => 'Software'],
            ['code' => '6105', 'name' => 'Biaya Maintenance Peralatan','level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6100', 'sort' => 86, 'maps' => 'Maintenance'],
            ['code' => '6106', 'name' => 'Beban Penyusutan',           'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6100', 'sort' => 87, 'desc' => 'Depreciation expense — pasangan akun 1202'],
            ['code' => '6107', 'name' => 'Beban Pajak',                'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6100', 'sort' => 88, 'maps' => 'Pajak', 'desc' => 'PPh 21 karyawan, PPh 23 jasa, dll'],

            ['code' => '6200', 'name' => 'Biaya Pemasaran',            'level' => 'subgroup', 'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6000', 'sort' => 90],
            ['code' => '6201', 'name' => 'Biaya Iklan Digital',        'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6200', 'sort' => 91, 'maps' => 'Marketing', 'desc' => 'Meta Ads, Google Ads, TikTok Ads'],
            ['code' => '6202', 'name' => 'Biaya Komisi Sales',         'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6200', 'sort' => 92, 'maps' => 'Komisi'],
            ['code' => '6203', 'name' => 'Biaya Promosi & Konten',     'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'operating_expense', 'parent' => '6200', 'sort' => 93, 'desc' => 'Foto produk, video reel, endorsement'],

            ['code' => '6300', 'name' => 'Biaya Lain-lain',            'level' => 'subgroup', 'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'other_expense', 'parent' => '6000', 'sort' => 95],
            ['code' => '6301', 'name' => 'Charity & CSR',              'level' => 'detail',   'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'other_expense', 'parent' => '6300', 'sort' => 96, 'maps' => 'Charity'],
            ['code' => '6302', 'name' => 'Biaya Pelatihan & Pengembangan','level'=>'detail',  'stmt' => 'income_statement', 'balance' => 'debit', 'cat' => 'other_expense', 'parent' => '6300', 'sort' => 97, 'maps' => 'Training', 'desc' => 'Workshop, kursus, sertifikasi tim'],
        ];

        $rows = array_map(fn($a) => [
            'code'             => $a['code'],
            'name'             => $a['name'],
            'account_level'    => $a['level'],
            'statement_type'   => $a['stmt'],
            'normal_balance'   => $a['balance'],
            'report_category'  => $a['cat'],
            'parent_code'      => $a['parent'] ?? null,
            'maps_to_category' => $a['maps']  ?? null,
            'description'      => $a['desc']  ?? null,
            'sort_order'       => $a['sort'],
            'is_active'        => true,
            'created_at'       => now(),
            'updated_at'       => now(),
        ], $accounts);

        DB::table('chart_of_accounts')->insert($rows);
    }
}
