<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoView;
use App\Support\ClientIp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoViewController extends Controller
{
    /**
     * Record a video view with user IP address, date & time (rate limited by the "views" limiter).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => 'required|string|max:100',
            'video_title' => 'nullable|string|max:255',
            'video_src' => 'nullable|string|max:255',
        ]);

        $video = Video::find($validated['video_id']);

        $view = VideoView::create([
            'video_id' => $validated['video_id'],
            'video_title' => $validated['video_title'] ?? ($video ? $video->title : 'Unknown Video'),
            'video_src' => $validated['video_src'] ?? $video?->video_src,
            'ip_address' => ClientIp::resolve($request),
            'user_agent' => substr((string) $request->userAgent(), 0, 500) ?: null,
            'viewed_at' => now(),
        ]);

        $videoViews = VideoView::where('video_id', $view->video_id);

        return response()->json([
            'success' => true,
            'message' => 'Video playback view recorded successfully',
            'data' => [
                'view_id' => $view->id,
                'video_id' => $view->video_id,
                'video_title' => $view->video_title,
                'ip_address' => $view->ip_address,
                'viewed_at' => $view->viewed_at->format('Y-m-d H:i:s'),
                'formatted_date' => $view->viewed_at->format('M d, Y h:i:s A').' (SLST)',
                'total_views' => (clone $videoViews)->count(),
                'unique_ips' => $videoViews->distinct()->count('ip_address'),
            ],
        ], 201);
    }
}
