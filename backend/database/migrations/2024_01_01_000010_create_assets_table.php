<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('category', 100)->default('Equipment');  // Equipment, Vehicle, Furniture, Other
            $table->date('purchase_date');
            $table->decimal('purchase_cost', 14, 2);
            $table->tinyInteger('useful_life_years')->default(5);
            $table->decimal('salvage_value', 14, 2)->default(0);
            $table->string('serial_number', 100)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
