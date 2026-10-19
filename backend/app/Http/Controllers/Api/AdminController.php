<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    /**
     * Authenticate Administrator against MySQL database.
     * Admin credentials are completely dynamic and validated from the DB.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password.',
            ], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Administrator privileges required.',
            ], 403);
        }

        $token = $user->createToken('admin-api-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Administrator authenticated successfully',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ],
        ]);
    }

    /**
     * Terminate admin session.
     */
    public function logout(Request $request): JsonResponse
    {
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Get authenticated admin user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $request->user(),
        ]);
    }

    /**
     * Comprehensive View and IP Analytics Dashboard.
     */
    public function stats(): JsonResponse
    {
        $realViewsCount = VideoView::count();
        $uniqueIpsCount = VideoView::distinct('ip_address')->count('ip_address');
        $todayViewsCount = VideoView::whereDate('viewed_at', Carbon::today())->count();
        $baseViewsSum = (int) Video::sum('views_base_count');
        $grandTotalViews = $baseViewsSum + $realViewsCount;

        // Breakdown per video
        $videosBreakdown = Video::withCount('views')
            ->get()
            ->map(function ($video) {
                $lastView = VideoView::where('video_id', $video->id)->latest('viewed_at')->first();
                $uniqueIps = VideoView::where('video_id', $video->id)->distinct('ip_address')->count('ip_address');
                return [
                    'id' => $video->id,
                    'title' => $video->title,
                    'category' => $video->category,
                    'total_views' => $video->total_views,
                    'real_recorded_views' => $video->views_count,
                    'unique_ips' => $uniqueIps,
                    'last_viewed_at' => $lastView ? $lastView->viewed_at->format('M d, Y h:i A') : 'No views yet',
                ];
            });

        // Top IP addresses watching videos
        $topIps = VideoView::select(
            'ip_address',
            DB::raw('COUNT(*) as total_views'),
            DB::raw('COUNT(DISTINCT video_id) as unique_videos'),
            DB::raw('MIN(viewed_at) as first_seen'),
            DB::raw('MAX(viewed_at) as last_seen')
        )
            ->groupBy('ip_address')
            ->orderByDesc('total_views')
            ->limit(10)
            ->get()
            ->map(function ($row) {
                return [
                    'ip_address' => $row->ip_address,
                    'total_views' => (int) $row->total_views,
                    'unique_videos' => (int) $row->unique_videos,
                    'first_seen' => Carbon::parse($row->first_seen)->format('M d, Y h:i A'),
                    'last_seen' => Carbon::parse($row->last_seen)->format('M d, Y h:i A'),
                ];
            });

        // Daily breakdown over last 7 days
        $dailyActivity = VideoView::select(
            DB::raw('DATE(viewed_at) as date'),
            DB::raw('COUNT(*) as views_count'),
            DB::raw('COUNT(DISTINCT ip_address) as unique_ips')
        )
            ->where('viewed_at', '>=', Carbon::now()->subDays(7)->startOfDay())
            ->groupBy(DB::raw('DATE(viewed_at)'))
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'real_views_recorded' => $realViewsCount,
                    'grand_total_views' => $grandTotalViews,
                    'unique_ips' => $uniqueIpsCount,
                    'today_views' => $todayViewsCount,
                    'total_videos' => Video::count(),
                ],
                'videos_breakdown' => $videosBreakdown,
                'top_ips' => $topIps,
                'daily_activity' => $dailyActivity,
            ],
        ]);
    }

    /**
     * Paginated list of view logs with IP addresses and dates.
     */
    public function views(Request $request): JsonResponse
    {
        $query = VideoView::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'LIKE', "%{$search}%")
                  ->orWhere('video_title', 'LIKE', "%{$search}%")
                  ->orWhere('video_id', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('video_id') && $request->video_id !== 'all') {
            $query->where('video_id', $request->video_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('viewed_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('viewed_at', '<=', $request->date_to);
        }

        $perPage = min((int) $request->get('per_page', 20), 100);
        $paginated = $query->orderByDesc('viewed_at')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Export view logs with IP addresses, dates, and video info to CSV.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="checkhub_video_views_' . date('Y-m-d_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['View ID', 'Video ID', 'Video Title', 'User IP Address', 'Date & Time', 'User Agent']);

            VideoView::orderByDesc('viewed_at')->chunk(500, function ($views) use ($handle) {
                foreach ($views as $v) {
                    fputcsv($handle, [
                        $v->id,
                        $v->video_id,
                        $v->video_title,
                        $v->ip_address,
                        $v->viewed_at->format('Y-m-d H:i:s'),
                        $v->user_agent,
                    ]);
                }
            });

            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Create a new administrator in the database.
     */
    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'New administrator registered successfully in database',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ], 201);
    }
}
