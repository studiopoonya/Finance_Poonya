<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('monthly_balances', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('period_month');     // 1-12
            $table->smallInteger('period_year');
            $table->string('account_code', 20);
            $table->string('account_name', 255);
            $table->decimal('debit', 16, 2)->default(0);
            $table->decimal('credit', 16, 2)->default(0);
            $table->integer('sort_order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['period_month', 'period_year', 'account_code']);
            $table->index(['period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('monthly_balances');
    }
};
