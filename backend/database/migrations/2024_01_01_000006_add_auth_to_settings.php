<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    public function up(): void
    {
        // Add admin credentials + auth token to the settings table
        DB::table('settings')->insertOrIgnore([
            ['key' => 'admin_username', 'value' => 'admin',              'type' => 'text',   'label' => 'Admin Username', 'group' => 'auth', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'admin_password', 'value' => Hash::make('admin123'), 'type' => 'secret', 'label' => 'Admin Password', 'group' => 'auth', 'created_at' => now(), 'updated_at' => now()],
            ['key' => 'auth_token',     'value' => null,                  'type' => 'secret', 'label' => 'Auth Token',     'group' => 'auth', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('key', ['admin_username', 'admin_password', 'auth_token'])->delete();
    }
};
