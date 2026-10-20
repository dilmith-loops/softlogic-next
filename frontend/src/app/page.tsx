'use client';

import { withBase } from '@/lib/basePath';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { GlitchTransition } from '@/components/GlitchTransition';
import { AgeGateModal } from '@/components/AgeGateModal';
import { Header } from '@/components/Header';
import { SubNav } from '@/components/SubNav';
import { SelfCheckModal } from '@/components/SelfCheckModal';
import { ReminderModal } from '@/components/ReminderModal';
import { ShareModal } from '@/components/ShareModal';
import { VideoItem, getVideos, recordView, recordExamStart, RecordViewResponse } from '@/lib/api';
import { INITIAL_VIDEOS, CAMPAIGN_VIDEO_URL } from '@/lib/videoData';

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem>(
    () => INITIAL_VIDEOS.find((v) => v.id === 'vid-11') || INITIAL_VIDEOS[0]
  );
  const [activeSrc, setActiveSrc] = useState<string>(CAMPAIGN_VIDEO_URL);
  const [recordedData, setRecordedData] = useState<RecordViewResponse['data'] | null>(null);
  const [likes, setLikes] = useState<number>(0);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [examConsent, setExamConsent] = useState<boolean>(true);
  const [consentError, setConsentError] = useState<boolean>(false);

  // Flow State: false = Show Root Age Gate with blurred backdrop; true = Video Player Page
  const [hasEntered, setHasEntered] = useState<boolean>(false);
  const [isGlitching, setIsGlitching] = useState<boolean>(false);

  // Modals
  const [isSelfCheckOpen, setIsSelfCheckOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Comments
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

  // Check session persistence on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const enteredSession = sessionStorage.getItem('checkhub_has_entered');
      if (enteredSession === 'true') {
        setHasEntered(true);
      }

      // Restore specific video if query param or storage exists
      const urlParams = new URLSearchParams(window.location.search);
      const videoQueryId = urlParams.get('v') || sessionStorage.getItem('checkhub_current_video');
      if (videoQueryId) {
        const found = INITIAL_VIDEOS.find((v) => v.id === videoQueryId);
        if (found) {
          setSelectedVideo(found);
        }
      }
    }

    // Load live updated counts from MySQL API
    async function loadVideos() {
      const liveList = await getVideos();
      if (liveList && liveList.length > 0) {
        const normalized = liveList.map((v) => ({
          ...v,
          videoSrc: CAMPAIGN_VIDEO_URL,
        }));
        setVideos(normalized);
        setSelectedVideo((prev) => normalized.find((v) => v.id === prev.id) || prev);
      }
    }
    loadVideos();
  }, []);

    const loggedPlaysRef = useRef<Set<string>>(new Set());

  // Log IP & view event ONLY when user actually plays/views the video (not on landing page)
  const handleVideoPlay = () => {
    if (!selectedVideo) return;
    const key = selectedVideo.id + '_' + activeSrc;
    if (loggedPlaysRef.current.has(key)) return;
    loggedPlaysRef.current.add(key);

    recordView(selectedVideo.id, selectedVideo.title, activeSrc)
      .then((res) => {
        if (res && res.success) {
          setRecordedData(res.data);
        }
      })
      .catch(console.warn);
  };

  // When selectedVideo changes on the watch page: update source, record IP in MySQL, and persist
  useEffect(() => {
    if (!hasEntered || !selectedVideo) return;

    setActiveSrc(CAMPAIGN_VIDEO_URL);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('checkhub_current_video', selectedVideo.id);
      const url = new URL(window.location.href);
      url.searchParams.set('v', selectedVideo.id);
      window.history.replaceState(null, '', url.toString());
    }

    // Note: IP log is triggered on video play event, not on landing page

    // Play video if not in exam
    if (typeof window !== "undefined" && localStorage.getItem("checkhub_in_exam") === "true") {
      return;
    }
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.play().catch(() => {
        if (videoPlayerRef.current) {
          videoPlayerRef.current.muted = true;
          videoPlayerRef.current.play().catch(console.warn);
        }
      });
    }
  }, [selectedVideo, hasEntered]);

  // Listen for exam active events across tabs to pause video playback
  useEffect(() => {
    let channel: BroadcastChannel | null = null;

    const pauseVideo = () => {
      if (videoPlayerRef.current && !videoPlayerRef.current.paused) {
        videoPlayerRef.current.pause();
      }
    };

    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel("checkhub_exam_sync");
        channel.onmessage = (e) => {
          if (e.data?.type === "EXAM_STARTED") {
            pauseVideo();
          }
        };
      }
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "checkhub_in_exam" && e.newValue === "true") {
        pauseVideo();
      }
    };
    window.addEventListener("storage", handleStorage);

    if (typeof window !== "undefined" && localStorage.getItem("checkhub_in_exam") === "true") {
      pauseVideo();
    }

    return () => {
      try {
        channel?.close();
      } catch {}
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Glitch transition trigger
  const triggerGlitch = (callback: () => void) => {
    setIsGlitching(true);
    // Switch state at midpoint of glitch breakdown
    setTimeout(() => {
      callback();
    }, 1100);

    // End glitch overlay and screen shake
    setTimeout(() => {
      setIsGlitching(false);
    }, 1750);
  };

  // Called when user clicks EITHER button on the Age Gate
  const handleEnterFromAgeGate = () => {
    triggerGlitch(() => {
      sessionStorage.setItem('checkhub_has_entered', 'true');
      sessionStorage.setItem('checkhub_age_verified', 'true');
      setHasEntered(true);
    });
  };

  const handleSelectRelated = (id: string) => {
    const nextVid = videos.find((v) => v.id === id) || videos[0];
    triggerGlitch(() => {
      setSelectedVideo(nextVid);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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

  // Render Examination Action Card with consent checkbox
  const renderExamCard = (isMobile: boolean = false) => (
    <div
      className={isMobile ? "exam-action-card-mobile" : "exam-action-card-desktop"}
      style={{
        background: "rgba(124, 31, 184, 0.08)",
        border: "1px solid rgba(124, 31, 184, 0.3)",
        borderRadius: "8px",
        padding: "1rem",
        marginBottom: "1.25rem",
      }}
    >
      <Link
        href="/exam"
        className="btn-subscribe btn-exam"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.45rem",
          width: "100%",
          textAlign: "center",
          padding: "0.85rem 1rem",
          fontSize: "0.92rem",
          fontWeight: 800,
          textDecoration: "none",
          opacity: examConsent ? 1 : 0.65,
          cursor: examConsent ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          boxShadow: examConsent ? "0 0 20px rgba(124, 31, 184, 0.4)" : "none",
        }}
        onClick={(e) => {
          if (!examConsent) {
            e.preventDefault();
            setConsentError(true);
            return;
          }
          if (videoPlayerRef.current) {
            videoPlayerRef.current.pause();
          }
          try {
            localStorage.setItem("checkhub_in_exam", "true");
            sessionStorage.setItem("exam_start_logged", "true");
          } catch {}
          // Record consented exam start in MySQL with IP and Sri Lanka timestamp
          recordExamStart(selectedVideo?.id).catch(console.warn);
        }}
      >
        🩺 Take 3-Minute Breast Examination
      </Link>

      <label
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.55rem",
          marginTop: "0.75rem",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <input
          type="checkbox"
          checked={examConsent}
          onChange={(e) => {
            setExamConsent(e.target.checked);
            if (e.target.checked) setConsentError(false);
          }}
          style={{
            accentColor: "var(--hub-orange)",
            width: "15px",
            height: "15px",
            marginTop: "2px",
            cursor: "pointer",
          }}
        />
        <span
          style={{
            fontSize: "0.78rem",
            lineHeight: 1.4,
            color: consentError ? "#fca5a5" : "var(--text-secondary)",
          }}
        >
          I understand the importance of raising awareness about breast cancer and women’s health, and I commit to sharing this important message with my loved ones.
        </span>
      </label>

      {consentError && (
        <div style={{ fontSize: "0.74rem", color: "#ef4444", marginTop: "0.35rem" }}>
          * Please check the consent box to proceed to the examination.
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`dark-theme ${!hasEntered && !isGlitching ? 'age-gate-active' : ''}`}
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #160726 0%, #000 60%)',
      }}
    >
      {/* Heavy Cyber Glitch Overlay */}
      <GlitchTransition active={isGlitching} />

      {/* =========================================================================
          VIEW A: ROOT AGE GATE WITH BLURRED BACKDROP (Shown on root before click)
          ========================================================================= */}
      {!hasEntered ? (
        <>
          {/* Age Gate Modal Overlay */}
          <AgeGateModal
            isOpen={!isGlitching && !hasEntered}
            onEnter={handleEnterFromAgeGate}
            onExit={handleEnterFromAgeGate}
          />

          {/* Blurred Background Mock (matches screenshot behind the modal) */}
          <Header
            onSearch={() => {}}
            onOpenSelfCheck={() => {}}
            onOpenReminder={() => {}}
            onOpenShare={() => {}}
          />
          <SubNav
            activeCategory="all"
            onSelectCategory={() => {}}
            totalCount={videos.length}
          />
          <main className="main-container">
            <div className="content-toolbar">
              <div className="toolbar-left">
                <h2 className="section-heading">Trending Breast Health Videos</h2>
                <span className="video-counter">Showing {videos.length} videos</span>
              </div>
            </div>
            <div className="video-grid">
              {videos.map((video, index) => {
                const thumbIndex = (index % 12) + 1;
                return (
                  <div
                    key={video.id}
                    className="video-card"
                    tabIndex={0}
                    role="button"
                    aria-label={`Play ${video.title}`}
                    onClick={() => handleEnterFromAgeGate()}
                  >
                    <div className="thumbnail-container">
                      <img
                        src={withBase(`/images/thumb_${thumbIndex}.jpg`)}
                        alt={video.title}
                        className="thumbnail-svg"
                        loading="lazy"
                      />
                      <span className="duration-badge">{video.duration}</span>
                      <span className="quality-pill-thumb">4K HD</span>
                      <div className="hover-play-overlay">
                        <div className="hover-play-icon">▶</div>
                      </div>
                    </div>
                    <div className="card-details">
                      <h3 className="card-title">{video.title}</h3>
                      <div className="card-author">
                        <span>{video.author}</span>
                        {video.authorVerified && <span className="author-check">✓</span>}
                      </div>
                      <div className="card-stats">
                        <span>👁️ {video.viewsCount || 0} real views</span>
                        <span className="rating">👍 {video.rating}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </>
      ) : (
        /* =========================================================================
           VIEW B: DEDICATED VIDEO PLAYER PAGE (Revealed after glitch, NO close button)
           ========================================================================= */
        <div style={{ padding: '1.25rem 1rem 3rem' }}>
          <div
            className="video-modal-dialog"
            style={{
              margin: '0 auto',
              maxWidth: '1440px',
              width: '100%',
              maxHeight: 'none',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(124, 31, 184, 0.2)',
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
                <Link href="/" className="site-logo-badge" style={{ textDecoration: 'none', fontSize: '1.4rem' }}>
                  <span className="logo-text">Check</span>
                  <span className="hub-pill">Hub</span>
                </Link>
                <span className="modal-title-pill">NOW PLAYING: AWARENESS SPECIAL</span>
              </div>

              {/* Header Action Buttons (NO Close Button) */}
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
                    onPlay={handleVideoPlay}
                  >
                    Your browser does not support HTML5 video.
                  </video>
                </div>

                {/* Official Campaign Awareness Stream */}
                <div
                  className="awareness-video-switcher"
                  style={{
                    background: 'rgba(124, 31, 184, 0.08)',
                    border: '1px solid rgba(124, 31, 184, 0.25)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span className="switcher-label" style={{ color: 'var(--hub-orange)', fontWeight: 700 }}>
                    🎗️ Official PSA:
                  </span>
                  <span style={{ fontSize: '0.86rem', color: '#fff', fontWeight: 600 }}>
                    Softlogic Life &amp; WCIC — Breast Cancer Awareness Campaign
                  </span>
                </div>

                {/* Video Details */}
                <div className="modal-body">
                  {/* Mobile View: Examination Card placed under video player, above video title */}
                  {renderExamCard(true)}

                  <div className="video-info-primary">
                    <h2 id="modalVideoTitle" className="video-main-title">
                      {selectedVideo.title}
                    </h2>

                    <div className="video-stats-bar">
                      <div className="stats-left">
                        <span className="views-count">
                          👁️ {recordedData ? recordedData.total_views.toLocaleString() : (selectedVideo.viewsCount || 0).toLocaleString()} real views
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
                          👍 <span>{likes}</span>
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

              {/* Recommended Checks Sidebar (Allows switching to any other video) */}
              <div className="watch-sidebar">
                {/* Desktop View: Examination Action Card above RECOMMENDED CHECKS */}
                {renderExamCard(false)}

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
                          src={withBase(`/images/thumb_${(parseInt(item.id.replace('vid-', '')) % 12) + 1}.jpg`)}
                          alt={item.title}
                        />
                        <span className="duration-badge">{item.duration}</span>
                      </div>
                      <div className="related-info">
                        <div className="related-title">{item.title}</div>
                        <div className="related-meta">{item.author}</div>
                        <div className="related-meta">
                          👁️ {item.viewsCount || 0} real views · 👍 {item.rating}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
