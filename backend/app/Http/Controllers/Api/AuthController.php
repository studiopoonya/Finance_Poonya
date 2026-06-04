<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $storedUsername = Setting::get('admin_username', 'admin');
        $storedHash     = Setting::get('admin_password');

        $usernameOk = $request->username === $storedUsername;
        $passwordOk = $storedHash && Hash::check($request->password, $storedHash);

        if (!$usernameOk || !$passwordOk) {
            return response()->json(['message' => 'Username atau password salah.'], 401);
        }

        // Generate a new random token and persist it
        $token = Str::random(64);
        Setting::set('auth_token', $token);

        return response()->json([
            'token'    => $token,
            'username' => $storedUsername,
        ]);
    }

    public function logout(): JsonResponse
    {
        Setting::set('auth_token', null);
        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'username' => Setting::get('admin_username', 'admin'),
        ]);
    }
}
