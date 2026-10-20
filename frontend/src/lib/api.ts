/**
 * CheckHub API Client
 * Interacts with backend REST API on MySQL with Sri Lanka Time (SLST)
 */

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    if (pathname.startsWith("/softlogic")) {
      return "/softlogic/api";
    }
  }
  return "http://localhost:8000/api";
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Format any timestamp into Sri Lanka Standard Time (Asia/Colombo, UTC+05:30)
 */
export function formatSriLankanDateTime(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === 'Never') return dateStr || '—';
  try {
    let cleanStr = String(dateStr).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanStr)) {
      cleanStr = cleanStr.replace(' ', 'T') + '+05:30';
    }
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return (
      d.toLocaleString('en-US', {
        timeZone: 'Asia/Colombo',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }) + ' (SLST)'
    );
  } catch {
    return String(dateStr);
  }
}

export interface VideoItem {
  id: string;
  youtubeId?: string;
  title: string;
  category: string;
  duration: string;
  durationSec: number;
  views: string;
  viewsCount: number;
  realViewsRecorded?: number;
  uniqueIpsCount?: number;
  rating: number;
  date: string;
  author: string;
  authorTitle: string;
  authorVerified: boolean;
  description: string;
  keyPoints: string[];
  animationType: string;
  accentColor: string;
  icon: string;
  badge?: string;
  videoSrc: string;
}

export interface RecordViewResponse {
  success: boolean;
  message: string;
  data: {
    view_id: number;
    video_id: string;
    video_title: string;
    ip_address: string;
    viewed_at: string;
    formatted_date: string;
    total_views: number;
    unique_ips: number;
  };
}

export interface ExamStartItem {
  id: number;
  ip_address: string;
  user_agent: string | null;
  video_id: string | null;
  consented: number;
  started_at: string;
}

export interface ExamStartsResponse {
  success: boolean;
  data: ExamStartItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AdminStats {
  overview: {
    real_views_recorded: number;
    grand_total_views: number;
    unique_ips: number;
    today_views: number;
    total_videos: number;
    total_exam_starts: number;
    today_exam_starts: number;
    unique_exam_ips: number;
  };
  videos_breakdown: Array<{
    id: string;
    title: string;
    category: string;
    real_recorded_views: number;
    unique_ips: number;
    last_viewed_at: string;
  }>;
  top_ips: Array<{
    ip_address: string;
    total_views: number;
    unique_videos: number;
    first_seen: string;
    last_seen: string;
  }>;
  daily_activity: Array<{
    date: string;
    views_count: number;
    unique_ips: number;
  }>;
}

export interface ViewLogItem {
  id: number;
  video_id: string;
  video_title: string;
  video_src: string | null;
  ip_address: string;
  user_agent: string | null;
  viewed_at: string;
}

export interface AdminViewsResponse {
  success: boolean;
  data: ViewLogItem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Fetch video listing with dynamic real view counts from MySQL
 */
export async function getVideos(params?: { category?: string; search?: string; sort?: string }): Promise<VideoItem[]> {
  try {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.sort) query.set('sort', params.sort);

    const res = await fetch(`${API_BASE_URL}/videos?${query.toString()}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch videos: ${res.statusText}`);
    }

    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.warn('API error, falling back to local dataset', err);
    return [];
  }
}

/**
 * Record a video play in MySQL database with user IP address and Sri Lanka timestamp.
 * Triggered ONLY when the user actually plays/watches the video.
 */
export async function recordView(videoId: string, videoTitle?: string, videoSrc?: string): Promise<RecordViewResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId,
        video_title: videoTitle,
        video_src: videoSrc,
      }),
    });

    if (!res.ok) {
      return {
        success: true,
        message: 'Local view noted',
        data: {
          view_id: 1,
          video_id: videoId,
          video_title: videoTitle || 'Campaign Video',
          ip_address: '127.0.0.1',
          viewed_at: new Date().toISOString(),
          formatted_date: new Date().toLocaleDateString() + ' (Local)',
          total_views: 1,
          unique_ips: 1,
        },
      };
    }

    return await res.json();
  } catch (err) {
    console.warn('Notice: View logging to remote DB deferred:', err);
    return null;
  }
}

/**
 * Record Exam Start event when user checks consent box and clicks "Take Breast Examination"
 */
export async function recordExamStart(videoId?: string): Promise<{ success: boolean; data?: any } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/exam-starts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        video_id: videoId || null,
      }),
    });

    if (!res.ok) {
      return { success: true };
    }

    return await res.json();
  } catch (err) {
    console.warn('Notice: Exam start logging deferred:', err);
    return { success: true };
  }
}

/**
 * Fetch Paginated Exam Starts for Admin
 */
export async function getAdminExamStarts(token: string, page = 1, perPage = 25): Promise<ExamStartsResponse> {
  const res = await fetch(`${API_BASE_URL}/admin/exam-starts?page=${page}&per_page=${perPage}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch exam starts');
  }

  return json;
}

/**
 * Admin Login: validates credentials from MySQL database
 */
export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server responded with status ${res.status}. Please check backend database configuration.`);
  }

  if (!res.ok || !data?.success) {
    throw new Error(data?.message || 'Invalid administrator credentials');
  }

  return data.data; // { token, user }
}

/**
 * Admin Logout
 */
export async function adminLogout(token: string) {
  try {
    await fetch(`${API_BASE_URL}/admin/logout`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Fetch Admin Overview Stats
 */
export async function getAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE_URL}/admin/stats`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch admin stats');
  }

  return json.data;
}

/**
 * Fetch Paginated View Logs with IP addresses & timestamps
 */
export async function getAdminViews(
  token: string,
  filters?: { search?: string; video_id?: string; date_from?: string; date_to?: string; page?: number; per_page?: number }
): Promise<AdminViewsResponse> {
  const query = new URLSearchParams();
  if (filters?.search) query.set('search', filters.search);
  if (filters?.video_id && filters.video_id !== 'all') query.set('video_id', filters.video_id);
  if (filters?.date_from) query.set('date_from', filters.date_from);
  if (filters?.date_to) query.set('date_to', filters.date_to);
  if (filters?.page) query.set('page', filters.page.toString());
  if (filters?.per_page) query.set('per_page', filters.per_page.toString());

  const res = await fetch(`${API_BASE_URL}/admin/views?${query.toString()}`, {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to fetch view logs');
  }

  return json;
}

/**
 * Create a new Administrator account into MySQL DB
 */
export async function createAdminUser(token: string, payload: { name: string; email: string; password: string }) {
  const res = await fetch(`${API_BASE_URL}/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to create admin user');
  }

  return json.data;
}

/**
 * Update Administrator Profile (Name, Email, optional Password)
 */
export async function updateAdminProfile(
  token: string,
  payload: { id: number; name: string; email: string; password?: string }
): Promise<{ success: boolean; data: { user: AdminUser }; message?: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Failed to update profile');
  }

  return json;
}
