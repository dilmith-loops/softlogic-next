<?php

namespace App\Http\Controllers;

use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PageController extends Controller
{
    /**
     * Video player page shown after the age gate (static Next.js export in public/watch).
     */
    public function watch(): BinaryFileResponse
    {
        return response()->file(public_path('watch/index.html'), [
            'Cache-Control' => 'no-cache',
        ]);
    }
}
