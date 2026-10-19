<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoViewController extends Controller
{
    /**
     * Record a video view with user IP address, date & time.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => 'required|string',
            'video_title' => 'nullable|string',
            'video_src' => 'nullable|string',
        ]);

        // Resolve client IP (handles standard proxies, load balancers, Cloudflare)
        $ip = $request->header('CF-Connecting-IP')
            ?: ($request->header('X-Forwarded-For') ? trim(explode(',', $request->header('X-Forwarded-For'))[0]) : $request->ip());

        // Default local loopback formatting if IPv6
        if ($ip === '::1') {
            $ip = '127.0.0.1';
        }

        $video = Video::find($validated['video_id']);
        $videoTitle = $validated['video_title'] ?? ($video ? $video->title : 'Unknown Video');
        $videoSrc = $validated['video_src'] ?? ($video ? $video->video_src : null);

        // Record the view event in the database
        $view = VideoView::create([
            'video_id' => $validated['video_id'],
            'video_title' => $videoTitle,
            'video_src' => $videoSrc,
            'ip_address' => $ip,
            'user_agent' => $request->userAgent(),
            'viewed_at' => now(), // exact date and time
        ]);

        // Get updated stats for this video
        $totalViews = $video ? $video->total_views : VideoView::where('video_id', $validated['video_id'])->count();
        $uniqueIps = VideoView::where('video_id', $validated['video_id'])->distinct('ip_address')->count('ip_address');

        return response()->json([
            'success' => true,
            'message' => 'Video view recorded successfully in database',
            'data' => [
                'view_id' => $view->id,
                'video_id' => $view->video_id,
                'video_title' => $view->video_title,
                'ip_address' => $view->ip_address,
                'viewed_at' => $view->viewed_at->toIso8601String(),
                'formatted_date' => $view->viewed_at->format('M d, Y h:i:s A'),
                'total_views' => $totalViews,
                'unique_ips' => $uniqueIps,
            ],
        ], 201);
    }
}
