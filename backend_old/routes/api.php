<?php

use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OcrController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── Dashboard ────────────────────────────────────────────────────────────
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/ledgers',  [DashboardController::class, 'ledgers']);

    // ── Transactions (CRUD) ──────────────────────────────────────────────────
    Route::apiResource('transactions', TransactionController::class);

    // ── AI Receipt Scanner ───────────────────────────────────────────────────
    Route::post('/ocr/scan', [OcrController::class, 'scan']);

    // ── Settings ─────────────────────────────────────────────────────────────
    Route::get('/settings',              [SettingController::class, 'index']);
    Route::put('/settings',              [SettingController::class, 'update']);
    Route::post('/settings/test-ai',     [SettingController::class, 'testConnection']);
});
