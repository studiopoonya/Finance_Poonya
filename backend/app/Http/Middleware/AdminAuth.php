<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');
        $token  = str_starts_with($header, 'Bearer ') ? substr($header, 7) : null;

        if (!$token) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $stored = Setting::get('auth_token');

        if (!$stored || $token !== $stored) {
            return response()->json(['message' => 'Token tidak valid atau sudah expired.'], 401);
        }

        return $next($request);
    }
}
