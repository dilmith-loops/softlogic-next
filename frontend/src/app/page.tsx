'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SubNav } from '@/components/SubNav';
import { AgeGateModal } from '@/components/AgeGateModal';
import { GlitchTransition } from '@/components/GlitchTransition';
import { VideoModal } from '@/components/VideoModal';
import { SelfCheckModal } from '@/components/SelfCheckModal';
import { ReminderModal } from '@/components/ReminderModal';
import { ShareModal } from '@/components/ShareModal';
import { VideoItem, getVideos } from '@/lib/api';
import { INITIAL_VIDEOS } from '@/lib/videoData';

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [isGlitching, setIsGlitching] = useState(false);
  const [isAgeGateActive, setIsAgeGateActive] = useState(true);
  const [isSelfCheckOpen, setIsSelfCheckOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCompactGrid, setIsCompactGrid] = useState(false);

  // Fetch updated dynamic view counts from Laravel Backend & MySQL
  useEffect(() => {
    async function loadData() {
      const data = await getVideos();
      if (data && data.length > 0) {
        setVideos(data);
      }
    }
    loadData();

    // Check if age gate previously bypassed in this session
    if (typeof window !== 'undefined' && sessionStorage.getItem('checkhub_age_verified')) {
      setIsAgeGateActive(false);
    }
  }, []);

  const triggerGlitch = (callback: () => void) => {
    setIsGlitching(true);
    setTimeout(() => {
      callback();
      setTimeout(() => {
        setIsGlitching(false);
      }, 500);
    }, 450);
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

  const handleOpenVideo = (video: VideoItem) => {
    triggerGlitch(() => {
      setSelectedVideo(video);
      setIsVideoModalOpen(true);
    });
  };

  const handleSelectRelated = (id: string) => {
    const nextVid = videos.find((v) => v.id === id) || videos[0];
    triggerGlitch(() => {
      setSelectedVideo(nextVid);
    });
  };

  // Filter and Sort Video Collection
  const filteredVideos = useMemo(() => {
    return videos
      .filter((v) => {
        if (activeCategory !== 'all') {
          if (activeCategory === 'top-rated') {
            if (v.rating < 98.5) return false;
          } else if (v.category !== activeCategory) {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            v.title.toLowerCase().includes(q) ||
            v.description.toLowerCase().includes(q) ||
            v.author.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'rating') return b.rating - a.rating;
        if (sortBy === 'duration') return a.durationSec - b.durationSec;
        if (sortBy === 'newest') return b.viewsCount - a.viewsCount;
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      });
  }, [videos, activeCategory, searchQuery, sortBy]);

  return (
    <div className={`dark-theme ${isAgeGateActive ? 'age-gate-active' : ''}`}>
      {/* Glitch Overlay */}
      <GlitchTransition active={isGlitching} />

      {/* Age Gate Modal */}
      <AgeGateModal
        isOpen={isAgeGateActive}
        onEnter={handleAgeGateEnter}
        onExit={handleAgeGateExit}
      />

      {/* Header */}
      <Header
        onSearch={(q) => setSearchQuery(q)}
        onOpenSelfCheck={() => setIsSelfCheckOpen(true)}
        onOpenReminder={() => setIsReminderOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

      {/* Categories Sub Navigation */}
      <SubNav
        activeCategory={activeCategory}
        onSelectCategory={(cat) => setActiveCategory(cat)}
        totalCount={videos.length}
      />

      {/* Main Content Area */}
      <main className="main-container">
        {/* Toolbar */}
        <div className="content-toolbar">
          <div className="toolbar-left">
            <h2 className="section-heading" id="currentSectionTitle">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : activeCategory === 'all'
                ? 'Trending Breast Health Videos'
                : `${activeCategory.toUpperCase()} Guides`}
            </h2>
            <span className="video-counter" id="visibleCounter">
              Showing {filteredVideos.length} of {videos.length} videos
            </span>
          </div>
          <div className="toolbar-right">
            <label htmlFor="sortSelect">Sort by:</label>
            <select
              id="sortSelect"
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="trending">🔥 Most Watched</option>
              <option value="rating">⭐ Highest Rated</option>
              <option value="duration">⏱️ Quickest Checks</option>
              <option value="newest">✨ Newest Uploads</option>
            </select>
            <button
              id="viewToggleBtn"
              className="view-toggle"
              title="Toggle Grid Size"
              onClick={() => setIsCompactGrid(!isCompactGrid)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
          </div>
        </div>

        {/* Search Filter Chip Banner */}
        {searchQuery && (
          <div className="filter-banner" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              Filtering for: <strong>&quot;{searchQuery}&quot;</strong>
            </span>
            <button onClick={() => setSearchQuery('')} className="admin-btn-logout">
              Clear filter
            </button>
          </div>
        )}

        {/* Video Grid */}
        <div
          className={`video-grid ${isCompactGrid ? 'compact-grid' : ''}`}
          id="videoGrid"
        >
          {filteredVideos.map((video, index) => {
            const thumbIndex = (index % 10) + 1;
            return (
              <div
                key={video.id}
                className="video-card"
                onClick={() => handleOpenVideo(video)}
                role="button"
                tabIndex={0}
                aria-label={`Play ${video.title}`}
              >
                <div className="thumbnail-wrapper">
                  <img
                    src={`/images/thumb_${thumbIndex}.jpg`}
                    alt={video.title}
                    loading="lazy"
                    className="video-thumb-img"
                  />
                  <span className="duration-badge">{video.duration}</span>
                  {video.badge && <span className="video-badge-pill">{video.badge}</span>}
                </div>
                <div className="video-card-body">
                  <div className="card-avatar-col">
                    <div className="channel-avatar">{video.icon || '🩺'}</div>
                  </div>
                  <div className="card-info-col">
                    <h3 className="card-title" title={video.title}>
                      {video.title}
                    </h3>
                    <div className="card-author">
                      <span>{video.author}</span>
                      {video.authorVerified && <span className="channel-verified">✓</span>}
                    </div>
                    <div className="card-meta-row">
                      <span className="card-views">👁️ {video.views}</span>
                      <span className="meta-separator">•</span>
                      <span className="card-rating">👍 {video.rating}%</span>
                      <span className="meta-separator">•</span>
                      <span className="card-date">{video.date}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Video Player Modal (Sends IP & view to MySQL DB on play) */}
      <VideoModal
        video={selectedVideo}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSelectRelated={handleSelectRelated}
        allVideos={videos}
        onOpenReminder={() => setIsReminderOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
      />

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
