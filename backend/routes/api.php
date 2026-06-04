<?php

use App\Http\Controllers\Api\AssetController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankReconciliationController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\MonthlyBalanceController;
use App\Http\Controllers\Api\ChartOfAccountController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InvestorController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\OcrController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TaxController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Middleware\AdminAuth;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // ── Auth (public) ─────────────────────────────────────────────────────────
    Route::post('/auth/login',  [AuthController::class, 'login']);
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware(AdminAuth::class);
    Route::get('/auth/me',      [AuthController::class, 'me'])->middleware(AdminAuth::class);

    // ── Protected routes ──────────────────────────────────────────────────────
    Route::middleware(AdminAuth::class)->group(function () {

        // Dashboard
        Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('/dashboard/ledgers',  [DashboardController::class, 'ledgers']);

        // Transactions
        Route::apiResource('transactions', TransactionController::class);

        // AI Receipt Scanner
        Route::post('/ocr/scan', [OcrController::class, 'scan']);

        // Chart of Accounts (full CRUD)
        Route::get('/chart-of-accounts',              [ChartOfAccountController::class, 'index']);
        Route::post('/chart-of-accounts',             [ChartOfAccountController::class, 'store']);
        Route::put('/chart-of-accounts/{code}',       [ChartOfAccountController::class, 'update']);
        Route::delete('/chart-of-accounts/{code}',    [ChartOfAccountController::class, 'destroy']);

        // Investors (full CRUD)
        Route::apiResource('investors', InvestorController::class);

        // Settings
        Route::get('/settings',          [SettingController::class, 'index']);
        Route::put('/settings',          [SettingController::class, 'update']);
        Route::post('/settings/test-ai', [SettingController::class, 'testConnection']);

        // Budgets
        Route::get('/budgets/cash-runway', [BudgetController::class, 'cashRunway']);
        Route::apiResource('budgets', BudgetController::class)->except(['show']);

        // Invoices
        Route::apiResource('invoices', InvoiceController::class);

        // Assets
        Route::apiResource('assets', AssetController::class);

        // Tax Records
        Route::apiResource('tax-records', TaxController::class);

        // Monthly Opening Balance (Neraca Saldo Awal)
        Route::prefix('monthly-opening')->group(function () {
            Route::get('/balances',            [MonthlyBalanceController::class, 'index']);
            Route::post('/balances',           [MonthlyBalanceController::class, 'bulkSave']);
            Route::post('/balances/copy',      [MonthlyBalanceController::class, 'copyFromPrevious']);
            Route::get('/balances/periods',    [MonthlyBalanceController::class, 'periods']);

            Route::get('/bank-accounts',       [BankReconciliationController::class, 'bankAccounts']);
            Route::post('/bank-accounts',      [BankReconciliationController::class, 'storeBankAccount']);
            Route::put('/bank-accounts/{bankAccount}',    [BankReconciliationController::class, 'updateBankAccount']);
            Route::delete('/bank-accounts/{bankAccount}', [BankReconciliationController::class, 'destroyBankAccount']);

            Route::get('/reconciliation',      [BankReconciliationController::class, 'index']);
            Route::post('/reconciliation',     [BankReconciliationController::class, 'bulkSave']);
            Route::post('/reconciliation/copy',[BankReconciliationController::class, 'copyFromPrevious']);
        });

        // Reports (read-only)
        Route::prefix('reports')->group(function () {
            Route::get('/profit-loss',    [ReportController::class, 'profitLoss']);
            Route::get('/balance-sheet',  [ReportController::class, 'balanceSheet']);
            Route::get('/cash-flow',      [ReportController::class, 'cashFlow']);
            Route::get('/unit-economics', [ReportController::class, 'unitEconomics']);
        });
    });
});
