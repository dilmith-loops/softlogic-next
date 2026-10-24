<?php

namespace App\Providers;

use App\Support\ClientIp;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $tooMany = fn () => response()->json([
            'success' => false,
            'message' => 'Rate limit exceeded. Please wait a moment.',
        ], 429);

        // Public tracking endpoints are limited per visitor IP to prevent flooding.
        RateLimiter::for('views', fn (Request $request) => Limit::perMinute(30)
            ->by(ClientIp::resolve($request))
            ->response($tooMany));

        RateLimiter::for('exam-starts', fn (Request $request) => Limit::perMinute(10)
            ->by(ClientIp::resolve($request))
            ->response($tooMany));
    }
}
