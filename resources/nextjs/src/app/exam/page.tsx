'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { recordExamStart } from '@/lib/api';
import { withBase } from '@/lib/basePath';

const VIDEO_SRC = withBase('/videos/brst-v4.mp4');
const FALLBACK_DURATION = 70.2;

interface LyricLine {
  time: number; // seconds into the video when the line is sung
  text: string;
}

interface Section {
  title: string;
  color: string;
  start: number;
  lines: LyricLine[];
}

// Timings match the captions burned into BRST v4.mp4
const SECTIONS: Section[] = [
  {
    title: 'B.R.S.T',
    color: '#5b0f8d',
    start: 0,
    lines: [{ time: 6, text: 'B.R.S.T - Breast' }],
  },
  {
    title: 'Bump',
    color: '#b5520b',
    start: 9,
    lines: [
      { time: 9, text: 'B කියන්නේ Bump' },
      { time: 12, text: 'රවුමට රවුමට, හෙමිහිට හෙමිහිට ගැටිති තියෙනවද බලමු' },
    ],
  },
  {
    title: 'Redness',
    color: '#8c2f5c',
    start: 16,
    lines: [
      { time: 16, text: 'R කියන්නේ Redness' },
      { time: 20, text: 'කැඩපත ළඟට ගිහින් රතු වී ඇත්දැයි බලමු' },
    ],
  },
  {
    title: 'Skin',
    color: '#1f5f73',
    start: 24,
    lines: [
      { time: 24, text: 'S කියන්නේ Skin' },
      { time: 28, text: 'වළ ගැහිලද, රැලි වැටිලද සමේ වෙනස්කම් බලමු' },
    ],
  },
  {
    title: 'Tip',
    color: '#6b3fa0',
    start: 32,
    lines: [
      { time: 32, text: 'T කියන්නේ Tip (nipple)' },
      { time: 35, text: 'Nipple එක ඇදිලද, දියරත් එනවද මොහොතක් අරගෙන බලමු' },
    ],
  },
  {
    title: 'See a doctor',
    color: '#a3243b',
    start: 41,
    lines: [
      { time: 41, text: 'වෙනසක් ඇත්නම් පමා නොවී doctor ge උපදෙස් ගනිමු' },
      { time: 48.5, text: 'මතක තියාගමු letters හතර' },
      { time: 52, text: 'B.R.S.T - Breast' },
    ],
  },
];

const LYRICS = SECTIONS.flatMap((section) => section.lines);

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function lastIndexAtOrBefore<T>(items: T[], time: number, at: (item: T) => number): number {
  let idx = -1;
  items.forEach((item, i) => {
    if (at(item) <= time) idx = i;
  });
  return idx;
}

export default function ExamPage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(FALLBACK_DURATION);
  const [playing, setPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Record exam start in MySQL if not already logged
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('exam_start_logged') !== 'true') {
        sessionStorage.setItem('exam_start_logged', 'true');
        recordExamStart().catch(console.warn);
      }
    }
  }, []);

  const sectionIndex = Math.max(0, lastIndexAtOrBefore(SECTIONS, currentTime, (s) => s.start));
  const activeLine = lastIndexAtOrBefore(LYRICS, currentTime, (l) => l.time);

  // Stop background video and broadcast exam active status across all tabs
  useEffect(() => {
    // 1. Pause any other video or audio elements in the current document
    document.querySelectorAll('video, audio').forEach((media) => {
      if (media === videoRef.current) return;
      try {
        (media as HTMLMediaElement).pause();
      } catch (err) {
        console.warn('Error pausing media element:', err);
      }
    });

    // 2. Set localStorage flag so other tabs know the user is in the exam
    try {
      localStorage.setItem('checkhub_in_exam', 'true');
    } catch {}

    // 3. Broadcast across tabs via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        channel = new BroadcastChannel('checkhub_exam_sync');
        channel.postMessage({ type: 'EXAM_STARTED' });
      }
    } catch {}

    // Send a periodic heartbeat pulse every 1.5 seconds while on the exam page
    const pulseInterval = setInterval(() => {
      try {
        localStorage.setItem('checkhub_in_exam', 'true');
        channel?.postMessage({ type: 'EXAM_STARTED' });
      } catch {}
    }, 1500);

    return () => {
      clearInterval(pulseInterval);
      try {
        localStorage.removeItem('checkhub_in_exam');
        channel?.postMessage({ type: 'EXAM_ENDED' });
        channel?.close();
      } catch {}
    };
  }, []);

  // Try to start playing on arrival; browsers may block it until the user presses play
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  // Follow the video clock smoothly while playing
  useEffect(() => {
    if (!playing) return;
    let animId: number;
    const tick = () => {
      if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [playing]);

  const seek = useCallback((time: number, autoplay = true) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = time;
    setCurrentTime(time);
    setIsDone(false);
    if (autoplay) video.play().catch(() => {});
  }, []);

  const goToStep = useCallback((i: number) => {
    const validIdx = Math.max(0, Math.min(SECTIONS.length - 1, i));
    seek(SECTIONS[validIdx].start);
  }, [seek]);

  // Jump to a specific lyric line
  const jumpToLine = (lineIdx: number) => seek(LYRICS[lineIdx].time);

  // Previous: restart the current section, or go back one if we're at its start
  const handlePrev = useCallback(() => {
    if (currentTime - SECTIONS[sectionIndex].start > 3) {
      seek(SECTIONS[sectionIndex].start);
    } else {
      goToStep(sectionIndex - 1);
    }
  }, [currentTime, sectionIndex, seek, goToStep]);

  const handleNext = useCallback(() => {
    if (sectionIndex === SECTIONS.length - 1) {
      videoRef.current?.pause();
      setIsDone(true);
    } else {
      goToStep(sectionIndex + 1);
    }
  }, [sectionIndex, goToStep]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isDone) {
      seek(0);
      return;
    }
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isDone, seek]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, handleNext, handlePrev]);

  // Auto-scroll lyrics to the active line
  useEffect(() => {
    const activeEl = lineRefs.current[Math.max(0, activeLine)];
    const scrollContainer = lyricsScrollRef.current;
    if (activeEl && scrollContainer) {
      scrollContainer.scrollTo({
        top: activeEl.offsetTop - scrollContainer.offsetTop - 16,
        behavior: 'smooth',
      });
    }
  }, [activeLine]);

  const currentSection = SECTIONS[sectionIndex];
  const isPlaying = playing && !isDone;

  return (
    <div className="dark-theme exam-page-container">
      {/* Header */}
      <header className="exam-header">
        <Link href="/" className="site-logo-badge" title="Back to CheckHub">
          <span className="logo-text">Check</span>
          <span className="hub-pill">Hub</span>
        </Link>
        <Link href="/" className="exam-back">
          ← Back to CheckHub
        </Link>
      </header>

      {/* Main Content */}
      <main className="exam-main">
        <div className="exam-heading">
          <h1>Your B.R.S.T Breast Self-Exam</h1>
          <p>Follow along and sing with the video. Four letters to remember.</p>
        </div>

        {/* Progress Segments (one per section of the song) */}
        <div className="exam-progress">
          {SECTIONS.map((section, i) => {
            const end = i < SECTIONS.length - 1 ? SECTIONS[i + 1].start : duration;
            const pct =
              i < sectionIndex || isDone
                ? 100
                : i > sectionIndex
                  ? 0
                  : Math.min(100, ((currentTime - section.start) / (end - section.start)) * 100);
            return (
              <div key={i} className="exam-progress-seg" onClick={() => goToStep(i)} title={`${i + 1}: ${section.title}`}>
                <span style={{ width: `${pct}%` }} />
              </div>
            );
          })}
        </div>

        {/* Video Stage */}
        <section className="exam-stage has-video">
          <video
            ref={videoRef}
            className="exam-video"
            src={VIDEO_SRC}
            playsInline
            preload="auto"
            onClick={togglePlay}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => {
              setPlaying(false);
              setIsDone(true);
            }}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || FALLBACK_DURATION)}
            onSeeked={(e) => setCurrentTime(e.currentTarget.currentTime)}
          >
            Your browser does not support HTML5 video.
          </video>

          {/* Completion Overlay */}
          <div className={`exam-done ${isDone ? "is-visible" : ""}`}>
            <h2>Check complete</h2>
            <p>Nice work. Repeat this once a month, and see a doctor if you notice anything new or different.</p>
            <div className="exam-done-actions">
              <Link href="/" className="btn-done-primary">
                Back to CheckHub
              </Link>
              <button type="button" className="btn-done-outline" onClick={() => seek(0)}>
                Start again
              </button>
            </div>
          </div>
        </section>

        {/* Controls */}
        <div className="exam-controls">
          <span className="exam-time">
            {formatTime(isDone ? duration : currentTime)} / {formatTime(duration)}
          </span>
          <div className="exam-buttons">
            <button type="button" className="exam-btn" onClick={handlePrev} aria-label="Previous section">
              <svg viewBox="0 0 24 24">
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>
            <button
              type="button"
              className="exam-btn play"
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              <svg viewBox="0 0 24 24">
                {isPlaying ? (
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                ) : (
                  <path d="M7 4l13 8-13 8z" />
                )}
              </svg>
            </button>
            <button type="button" className="exam-btn" onClick={handleNext} aria-label="Next section">
              <svg viewBox="0 0 24 24">
                <path d="M16 5h2v14h-2zM4 5l11 7-11 7z" />
              </svg>
            </button>
          </div>
          <span className="exam-step-label">{currentSection.title}</span>
        </div>

        {/* Spotify-style Lyrics Panel, synced to the video */}
        <section className="lyrics-panel" style={{ backgroundColor: currentSection.color }}>
          <div className="lyrics-panel-head">
            <span>Lyrics</span>
            <span>{currentSection.title}</span>
          </div>
          <div className="lyrics-scroll" ref={lyricsScrollRef}>
            <div className="lyrics-list" lang="si">
              {LYRICS.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  className={`lyric-line ${i === activeLine && !isDone ? "is-active" : i < activeLine || isDone ? "is-past" : ""}`}
                  onClick={() => jumpToLine(i)}
                >
                  {line.text}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <p className="exam-disclaimer">
          This guide is for awareness only and does not replace a clinical breast exam or mammogram. If you notice any change, talk to a doctor.
        </p>
      </main>
    </div>
  );
}
