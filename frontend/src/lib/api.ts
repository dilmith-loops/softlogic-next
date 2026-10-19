/**
 * CheckHub API Client
 * Interacts with Laravel backend REST API on MySQL
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
  };
  videos_breakdown: Array<{
    id: string;
    title: string;
    category: string;
    total_views: number;
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
 * Fetch video listing with dynamic view counts from Laravel & MySQL
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
 * Record a video play in MySQL database with user IP address and timestamp
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
      throw new Error(`Failed to record view: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error('Error logging video view to DB:', err);
    return null;
  }
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

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Login failed');
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
  const res = await fetch(`${API_BASE_URL}/admin/create-user`, {
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
