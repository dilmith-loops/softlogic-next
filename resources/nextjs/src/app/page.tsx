'use client';

import { withBase } from '@/lib/basePath';

import React, { useState, useEffect } from 'react';
import { GlitchTransition } from '@/components/GlitchTransition';
import { AgeGateModal } from '@/components/AgeGateModal';
import { Header } from '@/components/Header';
import { SubNav } from '@/components/SubNav';
import { INITIAL_VIDEOS } from '@/lib/videoData';
import { ThumbUpIcon } from '@/components/ThumbIcons';

/**
 * Index page: age gate over a blurred video grid. Either button leads to the
 * video player page served by Laravel at /softlogic/watch/.
 */
export default function AgeGatePage() {
  const [isGlitching, setIsGlitching] = useState<boolean>(false);
  const videos = INITIAL_VIDEOS;

  // Full page load (not client-side routing) so the request goes through the Laravel route
  const goToWatch = () => {
    window.location.assign(withBase('/watch/') + window.location.search);
  };

  // Visitors who already passed the gate this session go straight to the player
  useEffect(() => {
    if (sessionStorage.getItem('checkhub_has_entered') === 'true') {
      goToWatch();
    }
  }, []);

  // Called when user clicks EITHER button on the Age Gate (or a backdrop card)
  const handleEnterFromAgeGate = () => {
    if (isGlitching) return;
    setIsGlitching(true);
    // Navigate at the midpoint of the glitch breakdown, while the screen is fully distorted
    setTimeout(() => {
      sessionStorage.setItem('checkhub_has_entered', 'true');
      sessionStorage.setItem('checkhub_age_verified', 'true');
      goToWatch();
    }, 1100);
  };

  return (
    <div
      className={`dark-theme ${!isGlitching ? 'age-gate-active' : ''}`}
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #160726 0%, #000 60%)',
      }}
    >
      {/* Heavy Cyber Glitch Overlay */}
      <GlitchTransition active={isGlitching} />

      {/* Age Gate Modal Overlay */}
      <AgeGateModal
        isOpen={!isGlitching}
        onEnter={handleEnterFromAgeGate}
        onExit={handleEnterFromAgeGate}
      />

      {/* Blurred Background Mock (behind the modal) */}
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
                onClick={handleEnterFromAgeGate}
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
                    <span className="rating"><ThumbUpIcon size={12} color="#c084fc" filled={true} /> {video.rating}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
