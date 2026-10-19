'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { VideoItem, recordView, RecordViewResponse } from '@/lib/api';

interface VideoModalProps {
  video: VideoItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRelated: (id: string) => void;
  allVideos: VideoItem[];
  onOpenReminder: () => void;
  onOpenShare: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  isOpen,
  onClose,
  onSelectRelated,
  allVideos,
  onOpenReminder,
  onOpenShare,
}) => {
  const [activeSrc, setActiveSrc] = useState<string>('/breast_cancer_awareness.mp4');
  const [recordedData, setRecordedData] = useState<RecordViewResponse['data'] | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [likes, setLikes] = useState<number>(124000);
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [examConsent, setExamConsent] = useState<boolean>(false);
  const [consentError, setConsentError] = useState<boolean>(false);
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

  // When modal opens or video changes, record view in MySQL DB with user IP and timestamp
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

  useEffect(() => {
    if (!isOpen || !video) return;

    const initialSrc = video.videoSrc.startsWith('/') ? video.videoSrc : `/${video.videoSrc}`;
    setActiveSrc(initialSrc);

    // Call Laravel Backend to log IP address, video, and date & time
    const logPlay = async () => {
      setIsRecording(true);
      try {
        const res = await recordView(video.id, video.title, initialSrc);
        if (res && res.success) {
          setRecordedData(res.data);
        }
      } catch (err) {
        console.error('Failed to log view in DB', err);
      } finally {
        setIsRecording(false);
      }
    };

    logPlay();

    // Reset video player time and play if not in exam
    if (typeof window !== "undefined" && localStorage.getItem("checkhub_in_exam") === "true") {
      return;
    }
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = 0;
      videoPlayerRef.current.play().catch(() => {
        // Fallback to muted play if browser autoplay policy blocks audio
        if (videoPlayerRef.current) {
          videoPlayerRef.current.muted = true;
          videoPlayerRef.current.play().catch(console.warn);
        }
      });
    }
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  const handleStreamSwitch = async (newSrc: string) => {
    const formattedSrc = newSrc.startsWith('/') ? newSrc : `/${newSrc}`;
    setActiveSrc(formattedSrc);

    if (videoPlayerRef.current) {
      videoPlayerRef.current.src = formattedSrc;
      videoPlayerRef.current.load();
      videoPlayerRef.current.play().catch(console.warn);
    }

    // Re-log switch stream view with IP & timestamp
    try {
      const res = await recordView(video.id, `${video.title} (Stream: ${newSrc})`, formattedSrc);
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

  const related = allVideos.filter((v) => v.id !== video.id).slice(0, 5);

  const streams = [
    { label: 'Doctor FAQs & Awareness Guide', src: '/breast_cancer_awareness.mp4', icon: '📺' },
    { label: 'Awareness Coalition PSA', src: '/breast_cancer_psa.mp4', icon: '📢' },
    { label: 'Clinical Palpation Exam', src: '/breast_exam_video.webm', icon: '🩺' },
    { label: 'Healthy Driven PSA', src: '/healthy_driven_breast_cancer.mp4', icon: '🎗️' },
  ];

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="video-modal-dialog">
        {/* Modal Header */}
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-brand">
            <span className="logo-text">Check</span>
            <span className="hub-pill">Hub</span>
            <span className="modal-title-pill">NOW PLAYING: AWARENESS SPECIAL</span>
          </div>
          
        </div>
<div className="watch-layout">
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
                  {video.title}
                </h2>

                <div className="video-stats-bar">
                  <div className="stats-left">
                    <span className="views-count">
                      👁️ {recordedData ? recordedData.total_views.toLocaleString() : video.views} views
                    </span>
                    <span className="date-posted">Published: {video.date}</span>
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
                    <button className="interaction-btn share-btn-modal" onClick={onOpenShare}>
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
                      <span>{video.author} - {video.authorTitle}</span>
                      <span className="channel-verified">✓</span>
                    </div>
                    <div className="uploader-subs">1.4M Medical Awareness Subscribers</div>
                  </div>
                  
                </div>

                {/* Video Description & Key Points */}
                <div className="video-description-box">
                  <p className="modal-desc-text">{video.description}</p>
                  <div className="key-points-box">
                    <h4>🎯 What To Look For During This Check:</h4>
                    <ul>
                      {video.keyPoints &&
                        video.keyPoints.map((pt, idx) => <li key={idx}>{pt}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Quick Action CTA Buttons */}
                <div className="modal-cta-buttons">
                  <button className="btn-cta-pink" onClick={onOpenReminder}>
                    📅 Set Monthly Calendar Reminder
                  </button>
                  <button className="btn-cta-outline" onClick={onOpenShare}>
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

          {/* Related Videos Sidebar */}
          <div className="watch-sidebar">
                {/* 3-Minute Breast Examination Action Card above RECOMMENDED CHECKS */}
                <div
                  style={{
                    background: "rgba(255, 144, 0, 0.08)",
                    border: "1px solid rgba(255, 144, 0, 0.3)",
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
                      boxShadow: examConsent ? "0 0 20px rgba(255, 144, 0, 0.4)" : "none",
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
                      } catch {}
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

                <h3 className="sidebar-heading">RECOMMENDED CHECKS</h3>
            <div className="related-videos-list">
              {related.map((item) => (
                <div
                  key={item.id}
                  className="related-card"
                  onClick={() => onSelectRelated(item.id)}
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
    </div>
  );
};
