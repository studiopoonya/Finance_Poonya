<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledgers', function (Blueprint $table) {
            $table->id();
            // human-readable period label: "May 2025"
            $table->string('period_label', 50);
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('total_revenue', 14, 2)->default(0);
            $table->decimal('total_expenses', 14, 2)->default(0);
            $table->decimal('net_profit', 14, 2)->storedAs('total_revenue - total_expenses');
            // total capital invested by all investors as of this period
            $table->decimal('total_investment', 14, 2)->default(0);
            // ROI = net_profit / total_investment * 100
            $table->decimal('roi_percentage', 8, 2)->nullable();
            // monthly recurring burn rate (average expense per day × 30)
            $table->decimal('burn_rate', 14, 2)->nullable();
            $table->boolean('is_finalized')->default(false);
            $table->timestamps();

            $table->unique(['period_start', 'period_end']);
            $table->index('period_start');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ledgers');
    }
};
