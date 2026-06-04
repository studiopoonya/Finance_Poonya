<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bank_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('period_month');
            $table->smallInteger('period_year');
            $table->foreignId('bank_account_id')->constrained()->cascadeOnDelete();
            $table->decimal('opening_balance', 16, 2)->default(0);
            $table->decimal('closing_balance', 16, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['period_month', 'period_year', 'bank_account_id']);
            $table->index(['period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliations');
    }
};
