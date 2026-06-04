<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OcrController extends Controller
{
    /**
     * Accept a receipt image, send it to Claude Vision, return parsed fields.
     * If ANTHROPIC_API_KEY is not set, falls back to a mock response so the
     * UI can be developed without a live key.
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'receipt' => 'required|file|mimes:jpeg,jpg,png,webp,pdf|max:10240',
        ]);

        $file     = $request->file('receipt');
        $path     = $file->store('receipts', 'public');
        $mimeType = $file->getMimeType();
        $base64   = base64_encode(file_get_contents($file->getRealPath()));

        // DB setting takes priority over .env
        $apiKey = Setting::get('anthropic_api_key') ?? config('services.anthropic.key');

        if (empty($apiKey) || $apiKey === 'your-anthropic-api-key-here') {
            return $this->mockResponse($path);
        }

        return $this->callClaudeVision($base64, $mimeType, $path, $apiKey);
    }

    private function callClaudeVision(string $base64, string $mimeType, string $storedPath, string $apiKey): JsonResponse
    {
        $prompt = <<<PROMPT
Analyze this receipt image and extract the following fields in JSON format only.
Return ONLY valid JSON with no markdown fences, no explanation.

{
  "date": "YYYY-MM-DD",
  "merchant": "string",
  "amount": 0.00,
  "type": "revenue | expense",
  "category": "one of: Equipment, Marketing, Software, Rent, Supplies, Event Revenue, Other",
  "confidence": 0.95,
  "notes": "optional brief note"
}

Rules:
- type is 'revenue' if this is a payment received / sales receipt; 'expense' for purchases.
- category should be inferred from the merchant and line items.
- confidence is your confidence 0–1 in the extraction accuracy.
- If a field is unreadable use null.
PROMPT;

        try {
            $model    = Setting::get('claude_model') ?? config('services.anthropic.model', 'claude-opus-4-7');
            $response = Http::withHeaders([
                'x-api-key'         => $apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])->post('https://api.anthropic.com/v1/messages', [
                'model'      => $model,
                'max_tokens' => 512,
                'messages'   => [[
                    'role'    => 'user',
                    'content' => [
                        [
                            'type'   => 'image',
                            'source' => [
                                'type'       => 'base64',
                                'media_type' => $mimeType,
                                'data'       => $base64,
                            ],
                        ],
                        ['type' => 'text', 'text' => $prompt],
                    ],
                ]],
            ]);

            if ($response->failed()) {
                Log::error('Claude Vision API error', ['body' => $response->body()]);
                return response()->json(['error' => 'AI service unavailable'], 502);
            }

            $text   = $response->json('content.0.text', '{}');
            $parsed = json_decode($text, true) ?? [];

            return response()->json([
                'receipt_path' => $storedPath,
                'parsed'       => $parsed,
                'raw'          => $text,
            ]);
        } catch (\Throwable $e) {
            Log::error('Claude Vision exception', ['message' => $e->getMessage()]);
            return response()->json(['error' => 'Internal error during OCR'], 500);
        }
    }

    /** Demo mode – realistic mock so the UI works without a live API key. */
    private function mockResponse(string $storedPath): JsonResponse
    {
        $mock = [
            'date'       => now()->subDays(rand(0, 10))->format('Y-m-d'),
            'merchant'   => collect(['Canon Store', 'Adobe Systems', 'Party City', 'Meta Ads', 'Studio Rental'])->random(),
            'amount'     => round(rand(5000, 250000) / 100, 2),
            'type'       => 'expense',
            'category'   => collect(['Equipment', 'Software', 'Supplies', 'Marketing', 'Rent'])->random(),
            'confidence' => round(rand(82, 99) / 100, 2),
            'notes'      => 'Auto-detected via Claude Vision (mock)',
        ];

        return response()->json([
            'receipt_path' => $storedPath,
            'parsed'       => $mock,
            'raw'          => json_encode($mock),
            'is_mock'      => true,
        ]);
    }
}
