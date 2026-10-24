<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VideoController extends Controller
{
    /**
     * Display a listing of videos with dynamic view counts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Video::query()->withCount('views');

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('title', 'LIKE', "%{$term}%")
                    ->orWhere('description', 'LIKE', "%{$term}%")
                    ->orWhere('author', 'LIKE', "%{$term}%");
            });
        }

        // Sorting
        // Default order is the curated campaign order (position).
        switch ($request->get('sort')) {
            case 'rating':
                $query->orderByDesc('rating');
                break;
            case 'duration':
                $query->orderBy('duration_sec');
                break;
            case 'newest':
                $query->orderByDesc('created_at');
                break;
            case 'trending':
                $query->orderByDesc('views_count');
                break;
            default:
                $query->orderBy('position');
                break;
        }

        $videos = $query->get()->map(fn (Video $video) => $this->present($video));

        return response()->json([
            'success' => true,
            'count' => $videos->count(),
            'data' => $videos,
        ]);
    }

    /**
     * Display the specified video.
     */
    public function show(string $id): JsonResponse
    {
        $video = Video::withCount('views')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->present($video),
        ]);
    }

    /**
     * Shape a video for the frontend's VideoItem interface.
     */
    private function present(Video $video): array
    {
        return [
            'id' => $video->id,
            'youtubeId' => $video->youtube_id,
            'title' => $video->title,
            'category' => $video->category,
            'duration' => $video->duration,
            'durationSec' => $video->duration_sec,
            'views' => number_format($video->total_views).' views',
            'viewsCount' => $video->total_views,
            'realViewsRecorded' => $video->views_count,
            'uniqueIpsCount' => $video->unique_ips_count,
            'rating' => (float) $video->rating,
            'date' => $video->date_text,
            'author' => $video->author,
            'authorTitle' => $video->author_title,
            'authorVerified' => (bool) $video->author_verified,
            'description' => $video->description,
            'keyPoints' => $video->key_points,
            'animationType' => $video->animation_type,
            'accentColor' => $video->accent_color,
            'icon' => $video->icon,
            'badge' => $video->badge,
            'videoSrc' => $video->video_src,
        ];
    }
}
