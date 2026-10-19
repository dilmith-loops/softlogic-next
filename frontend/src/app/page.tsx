'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GlitchTransition } from '@/components/GlitchTransition';
import { AgeGateModal } from '@/components/AgeGateModal';
import { SelfCheckModal } from '@/components/SelfCheckModal';
import { ReminderModal } from '@/components/ReminderModal';
import { ShareModal } from '@/components/ShareModal';
import { VideoItem, getVideos, recordView, RecordViewResponse } from '@/lib/api';
import { INITIAL_VIDEOS } from '@/lib/videoData';

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem>(
    () => INITIAL_VIDEOS.find((v) => v.id === 'vid-11') || INITIAL_VIDEOS[0]
  );
  const [activeSrc, setActiveSrc] = useState<string>('/breast_cancer_awareness.mp4');
  const [recordedData, setRecordedData] = useState<RecordViewResponse['data'] | null>(null);
  const [likes, setLikes] = useState<number>(124000);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const [isAgeGateActive, setIsAgeGateActive] = useState(false);
  const [isSelfCheckOpen, setIsSelfCheckOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  const [comments, setComments] = useState<Array<{ name: string; time: string; text: string; likes: number }>>([
    {
      name: 'Sarah M. (Breast Cancer Survivor)',
      time: '1 day ago',
      text: 'My doctor told me finding it at Stage 1 gave me a 99% survival rate. Doing the circular check in the shower every month literally saved my life.',
      likes: 342,
    },
    {
      name: 'Dr. James Holloway, M.D.',
      time: '3 days ago',
      text: 'Crucial reminder: 80% of lumps are benign cysts! But never wait or guess—always get any new irregularity evaluated clinically with an ultrasound or mammogram.',
      likes: 189,
    },
  ]);
  const [newComment, setNewComment] = useState('');
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Restore saved video from URL query or sessionStorage on mount, and check age gate
  useEffect(() => {
    // Check Age Gate
    if (typeof window !== 'undefined') {
      const verified = sessionStorage.getItem('checkhub_age_verified');
      if (!verified) {
        setIsAgeGateActive(true);
      }

      // Check URL search param or sessionStorage for currently playing video
      const urlParams = new URLSearchParams(window.location.search);
      const videoQueryId = urlParams.get('v') || sessionStorage.getItem('checkhub_current_video');
      if (videoQueryId) {
        const found = INITIAL_VIDEOS.find((v) => v.id === videoQueryId);
        if (found) {
          setSelectedVideo(found);
        }
      }
    }

    // Fetch live updated dynamic views from MySQL API
    async function loadVideos() {
      const liveList = await getVideos();
      if (liveList && liveList.length > 0) {
        setVideos(liveList);
        // Sync selected video metadata if changed in DB
        setSelectedVideo((prev) => liveList.find((v) => v.id === prev.id) || prev);
      }
    }
    loadVideos();
  }, []);

  // When selectedVideo changes: update stream, record view with IP in MySQL, and update persistence
  useEffect(() => {
    if (!selectedVideo) return;

    const initialSrc = selectedVideo.videoSrc.startsWith('/')
      ? selectedVideo.videoSrc
      : `/${selectedVideo.videoSrc}`;
    setActiveSrc(initialSrc);

    // Persist to sessionStorage & URL query so refresh ALWAYS stays on this video
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('checkhub_current_video', selectedVideo.id);
      const url = new URL(window.location.href);
      url.searchParams.set('v', selectedVideo.id);
      window.history.replaceState(null, '', url.toString());
    }

    // Log view & user IP in MySQL database
    recordView(selectedVideo.id, selectedVideo.title, initialSrc)
      .then((res) => {
        if (res && res.success) {
          setRecordedData(res.data);
        }
      })
      .catch(console.warn);

    // Play video
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.play().catch(() => {
        if (videoPlayerRef.current) {
          videoPlayerRef.current.muted = true;
          videoPlayerRef.current.play().catch(console.warn);
        }
      });
    }
  }, [selectedVideo]);

  const triggerGlitch = (callback: () => void) => {
    setIsGlitching(true);
    setTimeout(() => {
      callback();
      setTimeout(() => {
        setIsGlitching(false);
      }, 400);
    }, 350);
  };

  const handleAgeGateEnter = () => {
    sessionStorage.setItem('checkhub_age_verified', 'true');
    triggerGlitch(() => {
      setIsAgeGateActive(false);
    });
  };

  const handleAgeGateExit = () => {
    sessionStorage.setItem('checkhub_age_verified', 'true');
    triggerGlitch(() => {
      setIsAgeGateActive(false);
      setIsSelfCheckOpen(true);
    });
  };

  const handleSelectRelated = (id: string) => {
    const nextVid = videos.find((v) => v.id === id) || videos[0];
    triggerGlitch(() => {
      setSelectedVideo(nextVid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleStreamSwitch = async (newSrc: string) => {
    const formattedSrc = newSrc.startsWith('/') ? newSrc : `/${newSrc}`;
    setActiveSrc(formattedSrc);

    if (videoPlayerRef.current) {
      videoPlayerRef.current.src = formattedSrc;
      videoPlayerRef.current.load();
      videoPlayerRef.current.play().catch(console.warn);
    }

    try {
      const res = await recordView(
        selectedVideo.id,
        `${selectedVideo.title} (Stream: ${newSrc})`,
        formattedSrc
      );
      if (res && res.success) {
        setRecordedData(res.data);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setComments([
      {
        name: 'You (Anonymous)',
        time: 'Just now',
        text: newComment.trim(),
        likes: 0,
      },
      ...comments,
    ]);
    setNewComment('');
  };

  const related = videos.filter((v) => v.id !== selectedVideo.id);

  const streams = [
    { label: 'Doctor FAQs & Awareness Guide', src: '/breast_cancer_awareness.mp4', icon: '📺' },
    { label: 'Awareness Coalition PSA', src: '/breast_cancer_psa.mp4', icon: '📢' },
    { label: 'Clinical Palpation Exam', src: '/breast_exam_video.webm', icon: '🩺' },
    { label: 'Healthy Driven PSA', src: '/healthy_driven_breast_cancer.mp4', icon: '🎗️' },
  ];

  return (
    <div
      className={`dark-theme ${isAgeGateActive ? 'age-gate-active' : ''}`}
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1a1206 0%, #000 60%)',
        padding: '1.25rem 1rem 3rem',
      }}
    >
      {/* Glitch Overlay */}
      <GlitchTransition active={isGlitching} />

      {/* Age Gate Modal (shows only on first visit before verification) */}
      <AgeGateModal
        isOpen={isAgeGateActive}
        onEnter={handleAgeGateEnter}
        onExit={handleAgeGateExit}
      />

      {/* Permanent Dedicated Watch Card (No video grid on page or on refresh) */}
      <div
        className="video-modal-dialog"
        style={{
          margin: '0 auto',
          maxWidth: '1440px',
          width: '100%',
          maxHeight: 'none',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 144, 0, 0.2)',
        }}
      >
        {/* Header Bar with Brand & Actions (NO close button) */}
        <div
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div className="modal-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span className="logo-text">Check</span>
              <span className="hub-pill">Hub</span>
            </Link>
            <span className="modal-title-pill">NOW PLAYING: AWARENESS SPECIAL</span>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setIsSelfCheckOpen(true)}
              className="action-btn highlight"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <span className="btn-icon">🩺</span>
              <span>Self-Check</span>
            </button>
            <button
              onClick={() => setIsReminderOpen(true)}
              className="action-btn reminder-btn"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <span className="btn-icon">📅</span>
              <span>Reminder</span>
            </button>
            <button
              onClick={() => setIsShareOpen(true)}
              className="action-btn share-btn"
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
            >
              <span className="btn-icon">📢</span>
              <span>Share</span>
            </button>
            <Link
              href="/admin"
              className="action-btn"
              style={{
                background: 'rgba(255, 144, 0, 0.12)',
                border: '1px solid rgba(255, 144, 0, 0.35)',
                color: 'var(--hub-orange)',
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                textDecoration: 'none',
              }}
            >
              <span className="btn-icon">🔐</span>
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Watch Page Content Layout */}
        <div className="watch-layout">
          {/* Main Column */}
          <div className="watch-main">
            {/* HTML5 Video Player Container */}
            <div className="player-wrapper">
              <video
                ref={videoPlayerRef}
                id="html5VideoPlayer"
                className="video-element"
                src={activeSrc}
                controls
                playsInline
                loop
                preload="metadata"
              >
                Your browser does not support HTML5 video.
              </video>
            </div>

            {/* Awareness Stream Channel Switcher */}
            <div className="awareness-video-switcher">
              <span className="switcher-label">📺 Awareness Stream:</span>
              {streams.map((s) => (
                <button
                  key={s.src}
                  className={`btn-stream-switch ${activeSrc === s.src ? 'active' : ''}`}
                  onClick={() => handleStreamSwitch(s.src)}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Video Details */}
            <div className="modal-body">
              <div className="video-info-primary">
                <h2 id="modalVideoTitle" className="video-main-title">
                  {selectedVideo.title}
                </h2>

                <div className="video-stats-bar">
                  <div className="stats-left">
                    <span className="views-count">
                      👁️ {recordedData ? recordedData.total_views.toLocaleString() : selectedVideo.views} views
                    </span>
                    <span className="date-posted">Published: {selectedVideo.date}</span>
                    <span className="verified-tag">✓ Medically Reviewed</span>
                  </div>
                  <div className="stats-right">
                    <button
                      className="interaction-btn like-btn"
                      onClick={() => {
                        setLikes(hasLiked ? likes - 1 : likes + 1);
                        setHasLiked(!hasLiked);
                      }}
                      style={{ color: hasLiked ? 'var(--hub-orange)' : undefined }}
                    >
                      👍 <span>{Math.floor(likes / 1000)}K</span>
                    </button>
                    <button className="interaction-btn dislike-btn">
                      👎 <span>42</span>
                    </button>
                    <button className="interaction-btn share-btn-modal" onClick={() => setIsShareOpen(true)}>
                      🔗 Share PSA
                    </button>
                    <button className="interaction-btn save-btn">
                      ⭐ Save Guide
                    </button>
                  </div>
                </div>

                {/* Uploader Profile */}
                <div className="uploader-profile">
                  <div className="uploader-avatar">🩺</div>
                  <div className="uploader-details">
                    <div className="uploader-name">
                      <span>{selectedVideo.author} - {selectedVideo.authorTitle}</span>
                      <span className="channel-verified">✓</span>
                    </div>
                    <div className="uploader-subs">1.4M Medical Awareness Subscribers</div>
                  </div>
                  <Link href="/exam" className="btn-subscribe btn-exam">
                    🩺 Take 3-Minute Breast Examination
                  </Link>
                </div>

                {/* Video Description & Key Points */}
                <div className="video-description-box">
                  <p className="modal-desc-text">{selectedVideo.description}</p>
                  <div className="key-points-box">
                    <h4>🎯 What To Look For During This Check:</h4>
                    <ul>
                      {selectedVideo.keyPoints &&
                        selectedVideo.keyPoints.map((pt, idx) => <li key={idx}>{pt}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Quick Action CTA Buttons */}
                <div className="modal-cta-buttons">
                  <button className="btn-cta-pink" onClick={() => setIsReminderOpen(true)}>
                    📅 Set Monthly Calendar Reminder
                  </button>
                  <button className="btn-cta-outline" onClick={() => setIsShareOpen(true)}>
                    📢 Prank A Friend To Save Their Life
                  </button>
                  <a
                    href="https://www.nationalbreastcancer.org/breast-self-exam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-cta-outline"
                  >
                    🌐 Visit National Breast Cancer Org ↗
                  </a>
                </div>

                {/* Interactive Comments Section */}
                <div className="modal-comments-section">
                  <div className="comments-header">
                    <h3>Community Discussion ({comments.length + 140} Comments)</h3>
                    <span className="comment-sort">Top Comments</span>
                  </div>

                  <form onSubmit={handleAddComment} className="add-comment-row">
                    <div className="comment-user-avatar">👤</div>
                    <input
                      type="text"
                      placeholder="Add a public comment or survivor message..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-comment-submit">
                      COMMENT
                    </button>
                  </form>

                  <div className="comments-list">
                    {comments.map((c, i) => (
                      <div key={i} className="comment-item">
                        <div className="comment-avatar">🩺</div>
                        <div className="comment-content">
                          <div className="comment-author-row">
                            <span className="comment-author-name">{c.name}</span>
                            <span className="comment-time">{c.time}</span>
                          </div>
                          <div className="comment-body-text">{c.text}</div>
                          <div className="comment-actions">
                            <button className="comment-like-btn">👍 {c.likes}</button>
                            <button className="comment-reply-btn">Reply</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Checks Sidebar (Always available to select any other video) */}
          <div className="watch-sidebar">
            <h3 className="sidebar-heading">RECOMMENDED CHECKS</h3>
            <div className="related-videos-list">
              {related.map((item) => (
                <div
                  key={item.id}
                  className="related-card"
                  onClick={() => handleSelectRelated(item.id)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="related-thumb">
                    <img
                      src={`/images/thumb_${(parseInt(item.id.replace('vid-', '')) % 10) + 1}.jpg`}
                      alt={item.title}
                    />
                    <span className="duration-badge">{item.duration}</span>
                  </div>
                  <div className="related-info">
                    <div className="related-title">{item.title}</div>
                    <div className="related-meta">{item.author}</div>
                    <div className="related-meta">
                      👁️ {item.views} · 👍 {item.rating}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Self-Check Guide Modal */}
      <SelfCheckModal
        isOpen={isSelfCheckOpen}
        onClose={() => setIsSelfCheckOpen(false)}
      />

      {/* Reminder Modal */}
      <ReminderModal
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
}
