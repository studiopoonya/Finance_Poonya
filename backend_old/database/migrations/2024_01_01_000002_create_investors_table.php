<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('investors', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('email', 255)->unique()->nullable();
            $table->string('company', 255)->nullable();
            $table->decimal('investment_amount', 14, 2)->default(0);
            $table->date('investment_date')->nullable();
            // equity percentage held (e.g. 15.50 = 15.50%)
            $table->decimal('equity_percentage', 6, 2)->default(0);
            $table->enum('status', ['active', 'exited', 'pending'])->default('active');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('investors');
    }
};
