<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamStart;
use App\Support\ClientIp;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamStartController extends Controller
{
    /**
     * Record a consented self-examination start (rate limited by the "exam-starts" limiter).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'video_id' => 'nullable|string|max:100',
        ]);

        $start = ExamStart::create([
            'ip_address' => ClientIp::resolve($request),
            'user_agent' => substr((string) $request->userAgent(), 0, 500) ?: null,
            'video_id' => $validated['video_id'] ?? null,
            'consented' => 1,
            'started_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Consented examination start recorded successfully',
            'data' => [
                'id' => $start->id,
                'ip_address' => $start->ip_address,
                'started_at' => $start->started_at->format('Y-m-d H:i:s'),
                'formatted_date' => $start->started_at->format('M d, Y h:i:s A').' (SLST)',
                'total_exam_starts' => ExamStart::count(),
                'unique_exam_ips' => ExamStart::distinct()->count('ip_address'),
            ],
        ], 201);
    }
}
