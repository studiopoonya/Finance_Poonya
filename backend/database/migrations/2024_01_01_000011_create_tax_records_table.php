<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_records', function (Blueprint $table) {
            $table->id();
            $table->tinyInteger('period_month');   // 1-12
            $table->smallInteger('period_year');
            $table->enum('tax_type', ['pph23', 'ppn_out', 'ppn_in', 'pph25', 'pph21']);
            $table->string('description', 255);
            $table->decimal('base_amount', 14, 2);
            $table->decimal('tax_rate', 5, 2);     // e.g. 2 = 2%
            $table->decimal('tax_amount', 14, 2);  // base × rate / 100
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->date('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['period_year', 'period_month']);
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_records');
    }
};
