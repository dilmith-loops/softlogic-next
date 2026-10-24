<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ExamStartController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\VideoViewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Served at /api/* locally and /softlogic/api/* on Hostinger.
*/

// Public Video & Tracking Endpoints
Route::get('/videos', [VideoController::class, 'index']);
Route::get('/videos/{id}', [VideoController::class, 'show']);

Route::post('/views', [VideoViewController::class, 'store'])->middleware('throttle:views');

Route::post('/exam-starts', [ExamStartController::class, 'store'])->middleware('throttle:exam-starts');
Route::post('/exam/start', [ExamStartController::class, 'store'])->middleware('throttle:exam-starts');

// Administrator Authentication
Route::post('/admin/login', [AdminController::class, 'login']);

// Protected Administrator Routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/me', [AdminController::class, 'me']);
    Route::post('/logout', [AdminController::class, 'logout']);
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/views', [AdminController::class, 'views']);
    Route::get('/exam-starts', [AdminController::class, 'examStarts']);
    Route::get('/export', [AdminController::class, 'exportCsv']);
    Route::post('/users', [AdminController::class, 'createUser']);
    Route::post('/profile', [AdminController::class, 'updateProfile']);
});
