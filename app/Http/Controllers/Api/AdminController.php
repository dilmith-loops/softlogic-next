<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamStart;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoView;
use App\Support\ClientIp;
use App\Support\CsvCell;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    private const MAX_LOGIN_ATTEMPTS = 5;

    private const LOGIN_LOCKOUT_SECONDS = 900;

    private const TOKEN_LIFETIME_DAYS = 7;

    /**
     * Authenticate an administrator. Locks an IP out for 15 minutes after 5 failed attempts.
     */
    public function login(Request $request): JsonResponse
    {
        $throttleKey = 'admin-login:'.ClientIp::resolve($request);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_LOGIN_ATTEMPTS)) {
            return response()->json([
                'success' => false,
                'message' => 'Account temporarily locked due to excessive failed attempts. Please wait 15 minutes.',
            ], 429);
        }

        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            RateLimiter::hit($throttleKey, self::LOGIN_LOCKOUT_SECONDS);

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

        RateLimiter::clear($throttleKey);

        $token = $user->createToken('admin-api-token', ['*'], now()->addDays(self::TOKEN_LIFETIME_DAYS))->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Admin authentication successful',
            'data' => [
                'token' => $token,
                'user' => $this->presentUser($user),
            ],
        ]);
    }

    /**
     * Terminate admin session.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated admin user profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->presentUser($request->user()),
        ]);
    }

    /**
     * View, IP and exam-start analytics for the dashboard.
     */
    public function stats(): JsonResponse
    {
        $totalViews = VideoView::count();

        $perVideo = VideoView::select(
            'video_id',
            DB::raw('COUNT(*) as real_recorded_views'),
            DB::raw('COUNT(DISTINCT ip_address) as unique_ips'),
            DB::raw('MAX(viewed_at) as last_viewed_at')
        )
            ->groupBy('video_id')
            ->get()
            ->keyBy('video_id');

        $videosBreakdown = Video::orderBy('position')->get()->map(function (Video $video) use ($perVideo) {
            $stats = $perVideo->get($video->id);

            return [
                'id' => $video->id,
                'title' => $video->title,
                'category' => $video->category,
                'real_recorded_views' => (int) ($stats->real_recorded_views ?? 0),
                'unique_ips' => (int) ($stats->unique_ips ?? 0),
                'last_viewed_at' => $stats->last_viewed_at ?? 'Never',
            ];
        });

        $topIps = VideoView::select(
            'ip_address',
            DB::raw('COUNT(*) as total_views'),
            DB::raw('COUNT(DISTINCT video_id) as unique_videos'),
            DB::raw('MIN(viewed_at) as first_seen'),
            DB::raw('MAX(viewed_at) as last_seen')
        )
            ->groupBy('ip_address')
            ->orderByDesc('total_views')
            ->limit(15)
            ->get()
            ->map(fn ($row) => [
                'ip_address' => $row->ip_address,
                'total_views' => (int) $row->total_views,
                'unique_videos' => (int) $row->unique_videos,
                'first_seen' => $row->first_seen,
                'last_seen' => $row->last_seen,
            ]);

        $dailyActivity = VideoView::select(
            DB::raw('DATE(viewed_at) as date'),
            DB::raw('COUNT(*) as views_count'),
            DB::raw('COUNT(DISTINCT ip_address) as unique_ips')
        )
            ->where('viewed_at', '>=', Carbon::now()->subDays(7)->startOfDay())
            ->groupBy(DB::raw('DATE(viewed_at)'))
            ->orderBy('date')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'overview' => [
                    'real_views_recorded' => $totalViews,
                    'grand_total_views' => $totalViews + (int) Video::sum('views_base_count'),
                    'unique_ips' => VideoView::distinct()->count('ip_address'),
                    'today_views' => VideoView::whereDate('viewed_at', Carbon::today())->count(),
                    'total_videos' => $videosBreakdown->count(),
                    'total_exam_starts' => ExamStart::count(),
                    'today_exam_starts' => ExamStart::whereDate('started_at', Carbon::today())->count(),
                    'unique_exam_ips' => ExamStart::distinct()->count('ip_address'),
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
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'LIKE', "%{$search}%")
                    ->orWhere('video_title', 'LIKE', "%{$search}%")
                    ->orWhere('video_id', 'LIKE', "%{$search}%");
            });
        }

        $query->filterVideo($request->input('video_id'))
            ->dateRange($request->input('date_from'), $request->input('date_to'));

        $paginated = $query
            ->select('id', 'video_id', 'video_title', 'video_src', 'ip_address', 'user_agent', 'viewed_at')
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return $this->paginatedResponse($paginated);
    }

    /**
     * Paginated list of consented exam starts.
     */
    public function examStarts(Request $request): JsonResponse
    {
        $paginated = ExamStart::orderByDesc('id')->paginate($this->perPage($request));

        return $this->paginatedResponse($paginated);
    }

    /**
     * Export view logs (?type=views, default) or exam starts (?type=exam) to CSV.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $isExam = $request->input('type') === 'exam';

        $filename = ($isExam ? 'checkhub_exam_starts_' : 'checkhub_video_views_').date('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($isExam) {
            $handle = fopen('php://output', 'w');

            if ($isExam) {
                fputcsv($handle, ['ID', 'IP Address', 'User Agent', 'Video ID', 'Consented', 'Started At (SLST)']);

                ExamStart::orderByDesc('id')->chunk(500, function ($starts) use ($handle) {
                    foreach ($starts as $s) {
                        fputcsv($handle, [
                            $s->id,
                            CsvCell::sanitize($s->ip_address),
                            CsvCell::sanitize($s->user_agent),
                            CsvCell::sanitize($s->video_id),
                            $s->consented,
                            $s->started_at->format('Y-m-d H:i:s'),
                        ]);
                    }
                });
            } else {
                fputcsv($handle, ['ID', 'Video ID', 'Video Title', 'IP Address', 'User Agent', 'Viewed At (SLST)']);

                VideoView::orderByDesc('id')->chunk(500, function ($views) use ($handle) {
                    foreach ($views as $v) {
                        fputcsv($handle, [
                            $v->id,
                            CsvCell::sanitize($v->video_id),
                            CsvCell::sanitize($v->video_title),
                            CsvCell::sanitize($v->ip_address),
                            CsvCell::sanitize($v->user_agent),
                            $v->viewed_at->format('Y-m-d H:i:s'),
                        ]);
                    }
                });
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Create a new administrator in the database.
     */
    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => 'required|email|max:191|unique:users,email',
            'password' => 'required|string|min:8',
        ], [
            'email.unique' => 'Admin email already exists in database.',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'admin',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'New administrator created successfully.',
            'data' => $this->presentUser($user),
        ], 201);
    }

    /**
     * Update the authenticated administrator's own name, email and optionally password.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|min:2|max:100',
            'email' => ['required', 'email', 'max:191', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
        ], [
            'email.unique' => 'Email address is already in use by another account.',
        ]);

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if (! empty($validated['password'])) {
            $user->password = $validated['password'];
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Administrator profile updated successfully.',
            'data' => [
                'user' => $this->presentUser($user),
            ],
        ]);
    }

    private function presentUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ];
    }

    private function perPage(Request $request): int
    {
        return min(100, max(5, (int) $request->input('per_page', 25)));
    }

    private function paginatedResponse(LengthAwarePaginator $paginated): JsonResponse
    {
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
}
