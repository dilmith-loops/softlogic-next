<?php

use App\Http\Controllers\PageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| The UI is the static Next.js export in public/ (built from resources/nextjs).
| Apache serves it directly; this fallback serves exported pages when running
| through `php artisan serve`, which only serves real files.
*/

// Age gate (index.html); leads to the video player page.
Route::get('/', fn () => response()->file(public_path('index.html')));
Route::get('/landingpage', fn () => response()->file(public_path('index.html')))->name('landingpage');

Route::get('/watch', [PageController::class, 'watch'])->name('watch');
Route::get('/videoplayer', [PageController::class, 'watch'])->name('videoplayer');

Route::fallback(function (Request $request) {
    abort_if($request->is('api/*'), 404);

    $page = realpath(public_path(trim($request->path(), '/').'/index.html'));

    if ($page && str_starts_with($page, realpath(public_path()))) {
        return response()->file($page);
    }

    $notFound = public_path('404.html');

    return is_file($notFound)
        ? response(file_get_contents($notFound), 404)->header('Content-Type', 'text/html; charset=UTF-8')
        : abort(404);
});
