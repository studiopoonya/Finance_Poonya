<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            // 'text' | 'secret' | 'select' | 'boolean'
            $table->string('type', 20)->default('text');
            $table->string('label', 100)->nullable();
            $table->string('group', 50)->default('general');
            $table->timestamps();
        });

        // Seed default rows so the UI always has something to render
        DB::table('settings')->insert([
            ['key' => 'anthropic_api_key',  'value' => null,                    'type' => 'secret',  'label' => 'Anthropic API Key',  'group' => 'ai',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'claude_model',        'value' => 'claude-opus-4-7',       'type' => 'select',  'label' => 'Claude Model',        'group' => 'ai',  'created_at' => now(), 'updated_at' => now()],
            ['key' => 'app_name',            'value' => 'PhotoBooth Finance',    'type' => 'text',    'label' => 'Application Name',   'group' => 'app', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'business_name',       'value' => 'My PhotoBooth Co.',     'type' => 'text',    'label' => 'Business Name',      'group' => 'app', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'currency',            'value' => 'USD',                   'type' => 'text',    'label' => 'Currency Code',      'group' => 'app', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'fiscal_year_start',   'value' => '01',                    'type' => 'select',  'label' => 'Fiscal Year Start',  'group' => 'app', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
