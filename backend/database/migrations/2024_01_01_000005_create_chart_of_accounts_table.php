<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chart_of_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name', 150);
            // Header accounts have children; Detail accounts post transactions
            $table->enum('account_level', ['group', 'subgroup', 'detail'])->default('detail');
            // Main financial statement category
            $table->enum('statement_type', ['balance_sheet', 'income_statement']);
            // Accounting classification
            $table->enum('normal_balance', ['debit', 'credit']);
            // Mapped to investor reporting category
            $table->enum('report_category', [
                'current_asset', 'fixed_asset',
                'current_liability', 'long_term_liability',
                'equity',
                'revenue', 'cogs', 'operating_expense', 'other_income', 'other_expense',
            ]);
            // Parent code for hierarchy (null = top level)
            $table->string('parent_code', 10)->nullable();
            // Maps to transaction category field (nullable — only detail accounts)
            $table->string('maps_to_category', 100)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index('parent_code');
            $table->index('report_category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chart_of_accounts');
    }
};
