'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AdminStats,
  AdminViewsResponse,
  ExamStartsResponse,
  AdminUser,
  getAdminStats,
  getAdminViews,
  getAdminExamStarts,
  adminLogout,
  createAdminUser,
  updateAdminProfile,
  formatSriLankanDateTime,
} from '@/lib/api';
import { EyeIcon, EyeOffIcon } from '@/components/PasswordToggleIcons';
import { StethoscopeIcon } from '@/components/StethoscopeIcon';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Analytics & Logs State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [viewsData, setViewsData] = useState<AdminViewsResponse | null>(null);
  const [examStartsData, setExamStartsData] = useState<ExamStartsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchIp, setSearchIp] = useState('');
  const [selectedVideo, setSelectedVideo] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [examPage, setExamPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'logs' | 'videos' | 'ips' | 'exams'>('logs');

  // New Admin Modal State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Verify auth on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('checkhub_admin_token');
    const savedUser = localStorage.getItem('checkhub_admin_user');

    if (!savedToken) {
      router.push('/admin/login');
      return;
    }

    setToken(savedToken);
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.warn(e);
      }
    }
  }, [router]);

  // Fetch Dashboard Data
  const loadDashboardData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const [statsRes, viewsRes, examStartsRes] = await Promise.all([
        getAdminStats(token),
        getAdminViews(token, {
          search: searchIp,
          video_id: selectedVideo,
          date_from: dateFrom,
          date_to: dateTo,
          page,
          per_page: 25,
        }),
        getAdminExamStarts(token, examPage, 25).catch(() => null),
      ]);

      setStats(statsRes);
      setViewsData(viewsRes);
      if (examStartsRes) {
        setExamStartsData(examStartsRes);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
      if (msg.includes('Unauthenticated') || msg.includes('401')) {
        localStorage.removeItem('checkhub_admin_token');
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, searchIp, selectedVideo, dateFrom, dateTo, page, examPage, router]);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, loadDashboardData]);

  const handleLogout = async () => {
    if (token) {
      await adminLogout(token);
    }
    localStorage.removeItem('checkhub_admin_token');
    localStorage.removeItem('checkhub_admin_user');
    router.push('/admin/login');
  };

  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/softlogic")) {
      return "/softlogic/api";
    }
    return "http://localhost:8000/api";
  };

  const handleExportViewsCsv = () => {
    if (!token) return;
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/admin/export?type=views`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `checkhub_video_views_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch((e) => alert('Export failed: ' + e));
  };

  const handleExportExamCsv = () => {
    if (!token) return;
    const apiUrl = getApiUrl();
    fetch(`${apiUrl}/admin/export?type=exam`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `checkhub_consented_exam_starts_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      })
      .catch((e) => alert('Export failed: ' + e));
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreatingAdmin(true);
    setAdminMsg(null);

    try {
      await createAdminUser(token, {
        name: adminName,
        email: adminEmail,
        password: adminPassword,
      });
      setAdminMsg({ text: `✓ Administrator [${adminEmail}] successfully created!`, isError: false });
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (err: unknown) {
      setAdminMsg({ text: err instanceof Error ? err.message : 'Failed to create administrator', isError: true });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !currentUser) return;
    setUpdatingProfile(true);
    setProfileMsg(null);

    try {
      const res = await updateAdminProfile(token, {
        id: currentUser.id,
        name: profileName,
        email: profileEmail,
        password: profilePassword.trim() ? profilePassword : undefined,
      });

      const updatedUser = res.data.user;
      setCurrentUser(updatedUser);
      localStorage.setItem('checkhub_admin_user', JSON.stringify(updatedUser));
      setProfileMsg({ text: '✓ Profile updated successfully!', isError: false });
      setProfilePassword('');
    } catch (err: unknown) {
      setProfileMsg({
        text: err instanceof Error ? err.message : 'Failed to update profile',
        isError: true,
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(text);
      alert(`Copied IP: ${text}`);
    }
  };

  return (
    <div className="admin-wrapper">
      {/* Top Navbar */}
      <nav className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link href="/" className="admin-brand">
            <div className="site-logo-badge">
              <span className="logo-text">Check</span>
              <span className="hub-pill">Hub</span>
            </div>
            <span className="admin-tag">ADMIN PORTAL</span>
          </Link>

        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            href="/"
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem', textDecoration: 'none' }}
          >
            ← View Public Site
          </Link>

          {currentUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                className="admin-user-pill"
                onClick={() => {
                  setProfileName(currentUser.name);
                  setProfileEmail(currentUser.email);
                  setProfilePassword('');
                  setProfileMsg(null);
                  setShowProfilePassword(false);
                  setIsEditProfileOpen(true);
                }}
                style={{ cursor: 'pointer' }}
                title="Click to edit administrator profile"
              >
                <div className="admin-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
                <div className="admin-user-meta">
                  <span className="admin-user-name">{currentUser.name}</span>
                  <span className="admin-user-role">{currentUser.email} • {currentUser.role}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileName(currentUser.name);
                  setProfileEmail(currentUser.email);
                  setProfilePassword('');
                  setProfileMsg(null);
                  setShowProfilePassword(false);
                  setIsEditProfileOpen(true);
                }}
                className="admin-btn admin-btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem', gap: '0.35rem' }}
                title="Edit your administrator name, email, or password"
              >
                ✏️ Edit Profile
              </button>
            </div>
          )}

          <button onClick={handleLogout} className="admin-btn-logout">
            Sign Out
          </button>
        </div>
      </nav>

      <div className="admin-container">
        {/* Header Row */}
        <div className="admin-header-row">
          <div className="admin-title-area">
            <h1>Video Views, Exam Starts &amp; User IP Analytics</h1>

          </div>

          <div className="admin-header-actions">
            <button onClick={loadDashboardData} className="admin-btn admin-btn-secondary" title="Reload from MySQL">
              🔄 Refresh Data
            </button>
            <button onClick={handleExportViewsCsv} className="admin-btn admin-btn-secondary">
              📥 Export Views CSV
            </button>
            <button onClick={handleExportExamCsv} className="admin-btn admin-btn-secondary" style={{ border: '1px solid rgba(124, 31, 184, 0.5)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <StethoscopeIcon size={16} color="currentColor" /> Export Exam CSV
            </button>
            <button onClick={() => setIsAddAdminOpen(true)} className="admin-btn admin-btn-primary">
              + Add Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-alert-box admin-alert-error" style={{ marginBottom: '1.5rem' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Metric Cards Grid - 5 Real Metrics Only */}
        <div className="admin-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <div className="admin-metric-card">
            <div className="metric-header">
              <span className="metric-label">Real Recorded Views</span>
              <span className="metric-icon">👁️</span>
            </div>
            <div className="metric-value">
              {stats ? stats.overview.real_views_recorded.toLocaleString() : '0'}
            </div>
            <div className="metric-sub">Total verified video views</div>
          </div>

          <div className="admin-metric-card accent-pink">
            <div className="metric-header">
              <span className="metric-label">Unique Viewer IPs</span>
              <span className="metric-icon">🌐</span>
            </div>
            <div className="metric-value">
              {stats ? stats.overview.unique_ips.toLocaleString() : '0'}
            </div>
            <div className="metric-sub">Distinct IP addresses watched videos</div>
          </div>

          <div className="admin-metric-card accent-cyan">
            <div className="metric-header">
              <span className="metric-label">Views Recorded Today</span>
              <span className="metric-icon">📅</span>
            </div>
            <div className="metric-value">
              {stats ? stats.overview.today_views.toLocaleString() : '0'}
            </div>
            <div className="metric-sub">Since 00:00:00 today (SLST)</div>
          </div>

          {/* Consented Exam Starts Metric Card */}
          <div className="admin-metric-card" style={{ borderColor: 'rgba(124, 31, 184, 0.4)' }}>
            <div className="metric-header">
              <span className="metric-label" style={{ color: 'var(--hub-orange)' }}>Consented Exam Starts</span>
              <span className="metric-icon"><StethoscopeIcon size={20} color="var(--hub-orange)" /></span>
            </div>
            <div className="metric-value" style={{ color: 'var(--hub-orange)' }}>
              {stats ? (stats.overview.total_exam_starts ?? 0).toLocaleString() : '0'}
            </div>
            <div className="metric-sub">
              {stats ? (stats.overview.unique_exam_ips ?? 0) : 0} distinct IPs consented &amp; clicked start
            </div>
          </div>

          <div className="admin-metric-card accent-green">
            <div className="metric-header">
              <span className="metric-label">Active Videos</span>
              <span className="metric-icon">🎥</span>
            </div>
            <div className="metric-value">
              {stats ? stats.overview.total_videos : '12'}
            </div>
            <div className="metric-sub">Active awareness guides</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('logs')}
            className={`admin-btn ${activeTab === 'logs' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ borderRadius: '6px' }}
          >
            📋 Live View Logs (IP &amp; Timestamps)
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`admin-btn ${activeTab === 'videos' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ borderRadius: '6px' }}
          >
            📊 Views Per Video Breakdown
          </button>
          <button
            onClick={() => setActiveTab('ips')}
            className={`admin-btn ${activeTab === 'ips' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ borderRadius: '6px' }}
          >
            🌐 Top Active IP Addresses
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`admin-btn ${activeTab === 'exams' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            style={{ borderRadius: '6px', background: activeTab === 'exams' ? 'var(--hub-orange)' : undefined, color: activeTab === 'exams' ? '#fff' : undefined, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <StethoscopeIcon size={16} color={activeTab === 'exams' ? '#fff' : 'currentColor'} /> Consented Exam Starts ({stats?.overview.total_exam_starts ?? 0})
          </button>
        </div>

        {/* TAB 1: LIVE VIEW LOGS */}
        {activeTab === 'logs' && (
          <div>
            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <div className="admin-filter-left">
                <div className="admin-search-box">
                  <span className="admin-search-icon">🔍</span>
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by IP address (e.g. 192.168.1.1)..."
                    value={searchIp}
                    onChange={(e) => {
                      setSearchIp(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>

                <select
                  value={selectedVideo}
                  onChange={(e) => {
                    setSelectedVideo(e.target.value);
                    setPage(1);
                  }}
                  className="admin-select"
                >
                  <option value="all">All Videos</option>
                  {stats?.videos_breakdown.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id}: {v.title.slice(0, 32)}...
                    </option>
                  ))}
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="admin-date-input"
                  />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>To:</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="admin-date-input"
                  />
                </div>

                {(searchIp || selectedVideo !== 'all' || dateFrom || dateTo) && (
                  <button
                    onClick={() => {
                      setSearchIp('');
                      setSelectedVideo('all');
                      setDateFrom('');
                      setDateTo('');
                      setPage(1);
                    }}
                    className="admin-btn-logout"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="admin-card-section">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <span>📋 Real-Time View Stream (Logged only upon video play)</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    ({viewsData?.pagination.total || 0} total view logs)
                  </span>
                </h3>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Video ID &amp; Title</th>
                      <th>User IP Address</th>
                      <th>Sri Lankan Date &amp; Time (SLST)</th>
                      <th>Browser / Device (User Agent)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          Loading records...
                        </td>
                      </tr>
                    ) : viewsData && viewsData.data.length > 0 ? (
                      viewsData.data.map((row) => (
                        <tr key={row.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{row.id}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{row.video_title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              ID: {row.video_id}
                            </div>
                          </td>
                          <td>
                            <div className="ip-badge">
                              <span>🌐 {row.ip_address}</span>
                              <button
                                onClick={() => copyToClipboard(row.ip_address)}
                                className="ip-copy-btn"
                                title="Copy IP Address"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className="date-badge">
                              🕒 {formatSriLankanDateTime(row.viewed_at)}
                            </span>
                          </td>
                          <td>
                            <div className="user-agent-text" title={row.user_agent || 'Unknown'}>
                              {row.user_agent || 'Direct API / Web Browser'}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                          No video views recorded yet. Playing a video on the home page logs the user&apos;s IP!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {viewsData && viewsData.pagination.last_page > 1 && (
                <div className="admin-pagination-bar">
                  <span>
                    Page {viewsData.pagination.current_page} of {viewsData.pagination.last_page} ({viewsData.pagination.total} total views)
                  </span>
                  <div className="pagination-controls">
                    <button
                      onClick={() => setPage((p) => Math.max(p - 1, 1))}
                      disabled={viewsData.pagination.current_page <= 1}
                      className="page-btn"
                    >
                      ← Previous
                    </button>
                    <span style={{ padding: '0 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {viewsData.pagination.current_page}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(p + 1, viewsData.pagination.last_page))}
                      disabled={viewsData.pagination.current_page >= viewsData.pagination.last_page}
                      className="page-btn"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: VIDEOS BREAKDOWN */}
        {activeTab === 'videos' && (
          <div className="admin-card-section">
            <div className="admin-card-header">
              <h3 className="admin-card-title">📊 Per-Video Real View &amp; IP Performance</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Video ID</th>
                    <th>Video Title</th>
                    <th>Category</th>
                    <th>Real Recorded Views</th>
                    <th>Unique IP Addresses</th>
                    <th>Last Viewed Timestamp (SLST)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.videos_breakdown.map((v) => (
                    <tr key={v.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--hub-orange)' }}>{v.id}</td>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{v.title}</td>
                      <td>
                        <span style={{ background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem' }}>
                          {v.category}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#10b981' }}>
                        {v.real_recorded_views.toLocaleString()} views
                      </td>
                      <td>
                        <div className="ip-badge">
                          <span>🌐 {v.unique_ips} Unique IPs</span>
                        </div>
                      </td>
                      <td className="date-badge">{formatSriLankanDateTime(v.last_viewed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TOP IP ADDRESSES */}
        {activeTab === 'ips' && (
          <div className="admin-card-section">
            <div className="admin-card-header">
              <h3 className="admin-card-title">🌐 Top Viewer IP Addresses</h3>
            </div>
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User IP Address</th>
                    <th>Total Views From IP</th>
                    <th>Distinct Videos Watched</th>
                    <th>First Seen (SLST)</th>
                    <th>Last Seen (SLST)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats && stats.top_ips.length > 0 ? (
                    stats.top_ips.map((ip) => (
                      <tr key={ip.ip_address}>
                        <td>
                          <div className="ip-badge">
                            <span>🌐 {ip.ip_address}</span>
                            <button
                              onClick={() => copyToClipboard(ip.ip_address)}
                              className="ip-copy-btn"
                              title="Copy IP"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--hub-orange)' }}>
                          {ip.total_views.toLocaleString()} views
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{ip.unique_videos} videos</td>
                        <td className="date-badge">🕒 {formatSriLankanDateTime(ip.first_seen)}</td>
                        <td className="date-badge">🕒 {formatSriLankanDateTime(ip.last_seen)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No IP activity recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CONSENTED EXAM STARTS */}
        {activeTab === 'exams' && (
          <div className="admin-card-section">
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="admin-card-title">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><StethoscopeIcon size={18} color="var(--hub-orange)" /> Consented Examination Starts</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({examStartsData?.pagination.total || stats?.overview.total_exam_starts || 0} total users submitted consent and clicked start)
                </span>
              </h3>
              <button onClick={handleExportExamCsv} className="admin-btn admin-btn-secondary" style={{ fontSize: '0.82rem' }}>
                📥 Download Exam Starts CSV
              </button>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User IP Address</th>
                    <th>Sri Lankan Date &amp; Time (SLST)</th>
                    <th>Associated Video</th>
                    <th>Consent &amp; Action</th>
                    <th>Browser / Device (User Agent)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        Loading exam records...
                      </td>
                    </tr>
                  ) : examStartsData && examStartsData.data.length > 0 ? (
                    examStartsData.data.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--hub-orange)' }}>#{row.id}</td>
                        <td>
                          <div className="ip-badge">
                            <span>🌐 {row.ip_address}</span>
                            <button
                              onClick={() => copyToClipboard(row.ip_address)}
                              className="ip-copy-btn"
                              title="Copy IP Address"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td>
                          <span className="date-badge">
                            🕒 {formatSriLankanDateTime(row.started_at)}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {row.video_id ? row.video_id : 'General Exam'}
                        </td>
                        <td>
                          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                            ✓ Consent Submitted &amp; Exam Started
                          </span>
                        </td>
                        <td>
                          <div className="user-agent-text" title={row.user_agent || 'Unknown'}>
                            {row.user_agent || 'Direct Web Browser'}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        No examination starts recorded yet. When a user submits the consent checkbox and clicks &quot;Take 3-Minute Breast Examination&quot;, it appears here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination for Exam Starts */}
            {examStartsData && examStartsData.pagination.last_page > 1 && (
              <div className="admin-pagination-bar">
                <span>
                  Page {examStartsData.pagination.current_page} of {examStartsData.pagination.last_page} ({examStartsData.pagination.total} total exam starts)
                </span>
                <div className="pagination-controls">
                  <button
                    onClick={() => setExamPage((p) => Math.max(p - 1, 1))}
                    disabled={examStartsData.pagination.current_page <= 1}
                    className="page-btn"
                  >
                    ← Previous
                  </button>
                  <span style={{ padding: '0 0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    {examStartsData.pagination.current_page}
                  </span>
                  <button
                    onClick={() => setExamPage((p) => Math.min(p + 1, examStartsData.pagination.last_page))}
                    disabled={examStartsData.pagination.current_page >= examStartsData.pagination.last_page}
                    className="page-btn"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE ADMIN MODAL */}
      {isAddAdminOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddAdminOpen(false);
              setAdminMsg(null);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#131318',
              border: '1px solid rgba(124, 31, 184, 0.35)',
              borderRadius: '14px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(124, 31, 184, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="site-logo-badge" style={{ fontSize: '1.2rem' }}>
                  <span className="logo-text">Check</span>
                  <span className="hub-pill">Hub</span>
                </div>
                <span
                  style={{
                    background: 'rgba(124, 31, 184, 0.15)',
                    color: 'var(--hub-orange)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    letterSpacing: '0.04em',
                  }}
                >
                  NEW ADMINISTRATOR
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddAdminOpen(false);
                  setAdminMsg(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem 1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.35rem', lineHeight: 1.5 }}>
                Create a new administrator account with portal access.
              </p>

              {adminMsg && (
                <div
                  className={`admin-alert-box ${adminMsg.isError ? 'admin-alert-error' : 'admin-alert-success'}`}
                  style={{ marginBottom: '1.25rem' }}
                >
                  <span>{adminMsg.isError ? '⚠️' : '✓'}</span>
                  <span>{adminMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleCreateAdminSubmit}>
                <div style={{ marginBottom: '1.15rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.45rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Dilmith Jayasuriya"
                    className="admin-form-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(22, 22, 30, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.15rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.45rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. admin@softlogic.lk"
                    className="admin-form-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(22, 22, 30, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.45rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="admin-form-input"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(22, 22, 30, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '0.75rem 2.8rem 0.75rem 1rem',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: showAdminPassword ? 'var(--hub-orange)' : 'rgba(255, 255, 255, 0.45)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s',
                      }}
                      title={showAdminPassword ? 'Hide password' : 'Show password'}
                      aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                    >
                      {showAdminPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingAdmin}
                  className="btn-subscribe"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: creatingAdmin ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 20px rgba(124, 31, 184, 0.35)',
                  }}
                >
                  {creatingAdmin ? 'Creating Account...' : 'Create Administrator Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    
      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsEditProfileOpen(false);
              setProfileMsg(null);
            }
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#131318',
              border: '1px solid rgba(124, 31, 184, 0.35)',
              borderRadius: '14px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(124, 31, 184, 0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="site-logo-badge" style={{ fontSize: '1.2rem' }}>
                  <span className="logo-text">Check</span>
                  <span className="hub-pill">Hub</span>
                </div>
                <span
                  style={{
                    background: 'rgba(124, 31, 184, 0.15)',
                    color: 'var(--hub-orange)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.6rem',
                    borderRadius: '4px',
                    letterSpacing: '0.04em',
                  }}
                >
                  EDIT PROFILE
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditProfileOpen(false);
                  setProfileMsg(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.75rem 1.5rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.35rem', lineHeight: 1.5 }}>
                Update your administrator credentials and security settings.
              </p>

              {profileMsg && (
                <div
                  className={`admin-alert-box ${profileMsg.isError ? 'admin-alert-error' : 'admin-alert-success'}`}
                  style={{ marginBottom: '1.25rem' }}
                >
                  <span>{profileMsg.isError ? '⚠️' : '✓'}</span>
                  <span>{profileMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfileSubmit}>
                <div style={{ marginBottom: '1.15rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.45rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. System Administrator"
                    className="admin-form-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(22, 22, 30, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.15rem' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-secondary)',
                      marginBottom: '0.45rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="e.g. admin@softlogic.lk"
                    className="admin-form-input"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      background: 'rgba(22, 22, 30, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: '#ffffff',
                      fontSize: '0.92rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <label
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      New Password
                    </label>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>(Optional)</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showProfilePassword ? 'text' : 'password'}
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value)}
                      placeholder="Leave empty to keep current password"
                      className="admin-form-input"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        background: 'rgba(22, 22, 30, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '0.75rem 2.8rem 0.75rem 1rem',
                        color: '#ffffff',
                        fontSize: '0.92rem',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: showProfilePassword ? 'var(--hub-orange)' : 'rgba(255, 255, 255, 0.45)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'color 0.2s',
                      }}
                      title={showProfilePassword ? 'Hide password' : 'Show password'}
                      aria-label={showProfilePassword ? 'Hide password' : 'Show password'}
                    >
                      {showProfilePassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="btn-subscribe"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: 'none',
                    cursor: updatingProfile ? 'not-allowed' : 'pointer',
                    boxShadow: '0 0 20px rgba(124, 31, 184, 0.35)',
                  }}
                >
                  {updatingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}