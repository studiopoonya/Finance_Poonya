<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Master data of bank sub-accounts (LINE BANK, SAQU, etc.)
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('bank_name', 50);          // line_bank | saqu | bca | etc.
            $table->string('internal_code', 30)->nullable();  // e.g. 16451859791 (LINE internal ref)
            $table->string('account_number', 30)->nullable(); // e.g. 10071881879
            $table->string('account_name', 255);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('bank_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
