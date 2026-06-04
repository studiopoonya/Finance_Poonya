<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Investors ──────────────────────────────────────────────────────────
        DB::table('investors')->insert([
            ['name' => 'Arya Capital', 'email' => 'arya@example.com', 'company' => 'Arya Ventures', 'investment_amount' => 25000, 'investment_date' => '2024-01-15', 'equity_percentage' => 15.00, 'status' => 'active', 'notes' => 'Lead seed investor', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Nova Fund', 'email' => 'nova@example.com', 'company' => 'Nova Partners', 'investment_amount' => 15000, 'investment_date' => '2024-03-01', 'equity_percentage' => 9.00, 'status' => 'active', 'notes' => 'Strategic partner', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Transactions (last 6 months of demo data) ─────────────────────────
        $categories = ['Equipment', 'Marketing', 'Software', 'Rent', 'Supplies'];
        $merchants  = ['Canon Store', 'Meta Ads', 'Adobe', 'Studio Space', 'Party City'];
        $now = Carbon::now();

        $transactions = [];
        for ($m = 5; $m >= 0; $m--) {
            $date = $now->copy()->subMonths($m);

            // Revenue entries
            foreach (range(1, rand(4, 7)) as $_) {
                $transactions[] = [
                    'transaction_date' => $date->copy()->addDays(rand(0, 27))->format('Y-m-d'),
                    'merchant'         => 'PhotoBooth Event #' . rand(100, 999),
                    'amount'           => rand(800, 3500) + (rand(0, 99) / 100),
                    'type'             => 'revenue',
                    'category'         => 'Event Revenue',
                    'notes'            => 'Wedding / Corporate booking',
                    'ai_verified'      => true,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }

            // Expense entries
            foreach (range(1, rand(3, 6)) as $i) {
                $idx = ($i - 1) % count($categories);
                $transactions[] = [
                    'transaction_date' => $date->copy()->addDays(rand(0, 27))->format('Y-m-d'),
                    'merchant'         => $merchants[$idx],
                    'amount'           => rand(100, 1200) + (rand(0, 99) / 100),
                    'type'             => 'expense',
                    'category'         => $categories[$idx],
                    'notes'            => null,
                    'ai_verified'      => false,
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ];
            }
        }

        DB::table('transactions')->insert($transactions);

        // ── Ledgers (auto-compute per month) ──────────────────────────────────
        for ($m = 5; $m >= 0; $m--) {
            $start = $now->copy()->subMonths($m)->startOfMonth();
            $end   = $start->copy()->endOfMonth();

            $rev = DB::table('transactions')
                ->whereBetween('transaction_date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
                ->where('type', 'revenue')
                ->sum('amount');

            $exp = DB::table('transactions')
                ->whereBetween('transaction_date', [$start->format('Y-m-d'), $end->format('Y-m-d')])
                ->where('type', 'expense')
                ->sum('amount');

            $totalInv = 40000;
            $net      = $rev - $exp;
            $roi      = $totalInv > 0 ? round(($net / $totalInv) * 100, 2) : 0;
            $days     = $start->daysInMonth;
            $burn     = $days > 0 ? round(($exp / $days) * 30, 2) : 0;

            DB::table('ledgers')->insert([
                'period_label'    => $start->format('F Y'),
                'period_start'    => $start->format('Y-m-d'),
                'period_end'      => $end->format('Y-m-d'),
                'total_revenue'   => $rev,
                'total_expenses'  => $exp,
                'total_investment'=> $totalInv,
                'roi_percentage'  => $roi,
                'burn_rate'       => $burn,
                'is_finalized'    => $m > 0,
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }
    }
}
