<?php

namespace App\Support;

use Illuminate\Http\Request;

class ClientIp
{
    /**
     * Resolve the visitor's IP, preferring Cloudflare and the first X-Forwarded-For hop when valid.
     */
    public static function resolve(Request $request): string
    {
        $ip = $request->server('REMOTE_ADDR', '127.0.0.1');

        $cloudflare = $request->header('CF-Connecting-IP');
        $forwarded = trim(explode(',', (string) $request->header('X-Forwarded-For'))[0]);

        if ($cloudflare && filter_var($cloudflare, FILTER_VALIDATE_IP)) {
            $ip = $cloudflare;
        } elseif ($forwarded !== '' && filter_var($forwarded, FILTER_VALIDATE_IP)) {
            $ip = $forwarded;
        }

        if ($ip === '::1') {
            $ip = '127.0.0.1';
        }

        return substr($ip, 0, 45);
    }
}
