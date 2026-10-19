<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\VideoController;
use App\Http\Controllers\Api\VideoViewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public Video & Views Endpoints
Route::get('/videos', [VideoController::class, 'index']);
Route::get('/videos/{id}', [VideoController::class, 'show']);

// Primary tracking endpoint: Records user IP address, video, date & time
Route::post('/views', [VideoViewController::class, 'store']);

// Administrator Authentication (Validated against MySQL database)
Route::post('/admin/login', [AdminController::class, 'login']);

// Protected Administrator Routes
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    Route::get('/me', [AdminController::class, 'me']);
    Route::post('/logout', [AdminController::class, 'logout']);
    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/views', [AdminController::class, 'views']);
    Route::get('/export', [AdminController::class, 'exportCsv']);
    Route::post('/create-user', [AdminController::class, 'createUser']);
});
