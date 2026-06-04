<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class SettingController extends Controller
{
    /** Return all settings, masking secret values. */
    public function index(): JsonResponse
    {
        $rows = Setting::orderBy('group')->orderBy('key')->get();

        $rows->transform(function (Setting $s) {
            if ($s->type === 'secret' && filled($s->value)) {
                // Show only last 4 chars so the user can confirm it's saved
                $s->value = str_repeat('•', 20) . substr($s->value, -4);
                $s->is_set = true;
            } else {
                $s->is_set = filled($s->value);
            }
            return $s;
        });

        return response()->json($rows->groupBy('group'));
    }

    /** Update one or many settings in a single request. */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'settings'       => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($data['settings'] as $item) {
            $key   = $item['key'];
            $value = $item['value'] ?? null;

            // If the client sends back a masked placeholder, skip (don't overwrite with garbage)
            if ($value && str_contains($value, '••••')) {
                continue;
            }

            Setting::set($key, $value);
        }

        return response()->json(['message' => 'Settings saved.']);
    }

    /**
     * Test the stored Anthropic API key by sending a tiny request to the
     * Claude messages API. Returns {ok: true/false, message: string}.
     */
    public function testConnection(): JsonResponse
    {
        $apiKey = Setting::get('anthropic_api_key');
        $model  = Setting::get('claude_model', 'claude-opus-4-7');

        if (empty($apiKey)) {
            return response()->json([
                'ok'      => false,
                'message' => 'No API key saved yet. Enter your Anthropic API key and save first.',
            ]);
        }

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'x-api-key'         => $apiKey,
                    'anthropic-version' => '2023-06-01',
                    'content-type'      => 'application/json',
                ])
                ->post('https://api.anthropic.com/v1/messages', [
                    'model'      => $model,
                    'max_tokens' => 16,
                    'messages'   => [[
                        'role'    => 'user',
                        'content' => 'Reply with the word OK only.',
                    ]],
                ]);

            if ($response->successful()) {
                return response()->json([
                    'ok'      => true,
                    'message' => "Connected successfully — model {$model} is ready.",
                ]);
            }

            $code  = $response->status();
            $error = $response->json('error.message', 'Unknown error');

            return response()->json([
                'ok'      => false,
                'message' => "API returned HTTP {$code}: {$error}",
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok'      => false,
                'message' => 'Network error: ' . $e->getMessage(),
            ]);
        }
    }
}
