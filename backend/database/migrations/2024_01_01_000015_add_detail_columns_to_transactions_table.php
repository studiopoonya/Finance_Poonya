<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->string('payment_method', 30)->nullable()->after('category');  // transfer, cash, qris, debit, credit
            $table->foreignId('bank_account_id')->nullable()->constrained()->nullOnDelete()->after('payment_method');
            $table->string('client_name', 255)->nullable()->after('bank_account_id');     // for revenue
            $table->string('event_type', 30)->nullable()->after('client_name');           // wedding, corporate, birthday, social, other
            $table->date('event_date')->nullable()->after('event_type');                  // for revenue
            $table->string('reference_number', 100)->nullable()->after('event_date');     // invoice/receipt no
            $table->string('sub_category', 100)->nullable()->after('reference_number');   // more specific
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['bank_account_id']);
            $table->dropColumn(['payment_method', 'bank_account_id', 'client_name', 'event_type', 'event_date', 'reference_number', 'sub_category']);
        });
    }
};
