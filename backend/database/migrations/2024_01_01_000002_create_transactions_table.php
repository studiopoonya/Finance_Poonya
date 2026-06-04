<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->date('transaction_date');
            $table->string('merchant', 255);
            $table->decimal('amount', 12, 2);
            // 'revenue' | 'expense'
            $table->enum('type', ['revenue', 'expense']);
            // e.g. Equipment, Marketing, Event Revenue, Rental, etc.
            $table->string('category', 100)->nullable();
            $table->text('notes')->nullable();
            // path to the original receipt image
            $table->string('receipt_image_path')->nullable();
            // raw JSON returned by Claude Vision before user edits
            $table->json('ai_raw_response')->nullable();
            // confidence score returned by Claude (0.00–1.00)
            $table->decimal('ai_confidence', 4, 2)->nullable();
            $table->boolean('ai_verified')->default(false);
            $table->foreignId('investor_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['transaction_date', 'type']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
