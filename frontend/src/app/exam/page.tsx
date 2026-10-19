'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// Silhouette shared by mirror steps
const TORSO = `
  <circle cx="160" cy="62" r="24" class="ill-line"/>
  <path d="M110 230 C110 150 128 112 160 112 C192 112 210 150 210 230" class="ill-line ill-fill"/>`;

interface ExamStep {
  title: string;
  summary: string;
  color: string;
  svg: string;
  lines: string[];
}

const STEPS: ExamStep[] = [
  {
    title: 'Look in the mirror',
    summary: "Stand straight, arms at your sides, and look for any visible change.",
    color: '#b5520b',
    svg: `
      <rect x="70" y="14" width="180" height="240" rx="18" class="ill-soft"/>
      <g class="anim-breathe">${TORSO}
        <path d="M118 128 L100 210" class="ill-line"/><path d="M202 128 L220 210" class="ill-line"/>
      </g>
      <path d="M84 40 L104 26" class="ill-soft"/><path d="M84 60 L120 34" class="ill-soft"/>`,
    lines: [
      'Stand in front of a mirror, shoulders straight, arms at your sides.',
      'Look at both breasts: their usual size, shape and colour.',
      'Watch for any dimpling, puckering or bulging of the skin.',
      'Notice a nipple that has changed position or turned inward.',
      'Look for redness, soreness, a rash or swelling.',
      "Small differences between sides are normal. You're looking for change.",
    ],
  },
  {
    title: 'Raise your arms',
    summary: "Lift your arms high and look again from a new angle.",
    color: '#8c2f5c',
    svg: `
      <rect x="70" y="14" width="180" height="240" rx="18" class="ill-soft"/>
      ${TORSO}
      <path d="M122 124 L96 36" class="ill-line anim-raise left"/>
      <path d="M198 124 L224 36" class="ill-line anim-raise right"/>
      <path d="M150 170 h20" class="ill-soft"/>`,
    lines: [
      'Now raise both arms high above your head.',
      'Look for the same changes from this new angle.',
      'Then press your hands firmly on your hips and flex your chest muscles.',
      'Turn slowly side to side to see the outer edges.',
      'Any new dimple or pull in the skin is worth noting.',
      "Take your time. There's no rush.",
    ],
  },
  {
    title: 'Check the nipples',
    summary: "Look closely at each nipple for discharge or skin changes.",
    color: '#1f5f73',
    svg: `
      <circle cx="160" cy="130" r="70" class="ill-soft"/>
      <circle cx="160" cy="130" r="22" class="ill-line ill-fill anim-pop"/>
      <circle cx="160" cy="130" r="40" class="ill-line anim-ring"/>
      <circle cx="160" cy="130" r="40" class="ill-line anim-ring delay"/>
      <g class="anim-scan"><circle cx="160" cy="130" r="46" class="ill-soft"/><path d="M193 163 L232 202" class="ill-line"/></g>`,
    lines: [
      'Gently look at each nipple and the area around it.',
      'Check for any fluid or discharge: watery, milky, yellow or bloody.',
      'Notice scaling, crusting or flaky skin on the nipple.',
      'Note any nipple that has recently become inverted.',
      'Discharge from one side, without squeezing, should be checked.',
      "Learn what's normal for you, so you can spot what isn't.",
    ],
  },
  {
    title: 'Lie down and feel',
    summary: "Use the pads of three fingers in small, coin-sized circles.",
    color: '#2f6b3a',
    svg: `
      <circle cx="160" cy="130" r="80" class="ill-soft"/>
      <circle cx="160" cy="130" r="50" class="ill-soft"/>
      <circle cx="160" cy="130" r="20" class="ill-soft"/>
      <g class="anim-orbit">
        <circle cx="160" cy="80" r="12" class="ill-line ill-fill"/>
        <circle cx="145" cy="72" r="9" class="ill-line"/><circle cx="175" cy="72" r="9" class="ill-line"/>
      </g>
      <text x="160" y="250" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="JetBrains Mono, monospace" font-size="12">LIGHT · MEDIUM · FIRM</text>`,
    lines: [
      'Lie down on your back and put your right arm behind your head.',
      'Use the pads of the three middle fingers on your left hand.',
      'Move in small, coin-sized circles over your right breast.',
      'Use light pressure first, then medium, then firm.',
      'Cover everything: collarbone to upper belly, armpit to cleavage.',
      'Then switch sides and repeat on your left breast.',
    ],
  },
  {
    title: 'Follow a pattern',
    summary: "Move up and down in strips so you don't miss any area.",
    color: '#6b3fa0',
    svg: `
      <rect x="40" y="34" width="240" height="192" rx="14" class="ill-soft"/>
      <path d="M60 50 V210 H100 V50 H140 V210 H180 V50 H220 V210 H260 V50" class="ill-soft" stroke-dasharray="6 6"/>
      <circle r="11" class="ill-dot">
        <animateMotion dur="9s" repeatCount="indefinite" path="M60 50 V210 H100 V50 H140 V210 H180 V50 H220 V210 H260 V50"/>
      </circle>`,
    lines: [
      'Use an up-and-down pattern, like mowing a lawn.',
      'Start at the armpit and move across in vertical strips.',
      'Keep your fingers flat and together as you move.',
      'Feel for lumps, thickening, hard knots or anything different.',
      "Don't forget the armpit, where the lymph nodes sit.",
      'Many people repeat this in the shower, where soapy skin helps.',
    ],
  },
  {
    title: 'Know when to see a doctor',
    summary: "Most lumps aren't cancer, but every new change deserves a check.",
    color: '#a3243b',
    svg: `
      <rect x="80" y="40" width="160" height="170" rx="14" class="ill-line ill-fill"/>
      <path d="M80 82 H240" class="ill-line"/>
      <path d="M118 28 V52 M202 28 V52" class="ill-line"/>
      <circle cx="160" cy="146" r="30" class="ill-line anim-pop"/>
      <path d="M146 146 l10 10 l20 -20" class="ill-line"/>`,
    lines: [
      'Most lumps are not cancer, but every new change deserves a check.',
      'See a doctor if you find a new lump, dimpling or nipple change.',
      'Also see a doctor for discharge, lasting pain or skin changes.',
      'Do this check once a month, a few days after your period ends.',
      "If you don't have periods, pick the same day each month.",
      "You've finished your 3-minute check. See you next month.",
    ],
  },
];

const LINE_MS = 5000;
const STEP_MS = LINE_MS * 6; // 30,000 ms
const TOTAL_MS = STEP_MS * STEPS.length; // 180,000 ms

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function ExamPage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0); // ms within current step
  const [playing, setPlaying] = useState(true);
  const [isDone, setIsDone] = useState(false);

  const lyricsScrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastTickRef = useRef<number | null>(null);

  // Active line calculation
  const activeLine = Math.min(5, Math.floor(elapsed / LINE_MS));

  // Go to specific step
  const goToStep = useCallback((i: number) => {
    const validIdx = Math.max(0, Math.min(STEPS.length - 1, i));
    setStepIndex(validIdx);
    setElapsed(0);
    setIsDone(false);
    setPlaying(true);
    lastTickRef.current = null;
  }, []);

  // Jump to specific line within the current step
  const jumpToLine = (lineIdx: number) => {
    setElapsed(lineIdx * LINE_MS);
    lastTickRef.current = null;
  };

  // Next / Previous
  const handlePrev = useCallback(() => {
    if (elapsed > 3000) {
      setElapsed(0);
      lastTickRef.current = null;
    } else {
      goToStep(stepIndex - 1);
    }
  }, [elapsed, stepIndex, goToStep]);

  const handleNext = useCallback(() => {
    if (stepIndex === STEPS.length - 1) {
      setPlaying(false);
      setIsDone(true);
      setElapsed(STEP_MS);
    } else {
      goToStep(stepIndex + 1);
    }
  }, [stepIndex, goToStep]);

  const togglePlay = useCallback(() => {
    if (isDone) {
      goToStep(0);
      return;
    }
    setPlaying((prev) => {
      lastTickRef.current = null;
      return !prev;
    });
  }, [isDone, goToStep]);

  // RequestAnimationFrame tick loop
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      if (playing && !isDone) {
        if (lastTickRef.current !== null) {
          const delta = now - lastTickRef.current;
          setElapsed((prev) => {
            const nextElapsed = prev + delta;
            if (nextElapsed >= STEP_MS) {
              setStepIndex((currIdx) => {
                if (currIdx < STEPS.length - 1) {
                  return currIdx + 1;
                } else {
                  setIsDone(true);
                  setPlaying(false);
                  return currIdx;
                }
              });
              return 0;
            }
            return nextElapsed;
          });
        }
        lastTickRef.current = now;
      }
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [playing, isDone]);

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

  // Auto-scroll lyrics to active line
  useEffect(() => {
    const activeEl = lineRefs.current[activeLine];
    const scrollContainer = lyricsScrollRef.current;
    if (activeEl && scrollContainer) {
      scrollContainer.scrollTo({
        top: activeEl.offsetTop - scrollContainer.offsetTop - 16,
        behavior: 'smooth',
      });
    }
  }, [activeLine, stepIndex]);

  const currentStep = STEPS[stepIndex];
  const totalElapsedMs = stepIndex * STEP_MS + (isDone ? STEP_MS : elapsed);

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
          <h1>Your 3-Minute Breast Self-Exam</h1>
          <p>Follow along. Six steps, about 30 seconds each.</p>
        </div>

        {/* Progress Segments */}
        <div className="exam-progress">
          {STEPS.map((_, i) => {
            const pct = i < stepIndex ? 100 : i > stepIndex ? 0 : isDone ? 100 : (elapsed / STEP_MS) * 100;
            return (
              <div key={i} className="exam-progress-seg" onClick={() => goToStep(i)} title={`Step ${i + 1}: ${STEPS[i].title}`}>
                <span style={{ width: `${pct}%` }} />
              </div>
            );
          })}
        </div>

        {/* Slide Stage with Visual & Step Info */}
        <section className="exam-stage" aria-live="polite">
          {STEPS.map((step, i) => (
            <article
              key={i}
              className={`exam-slide ${i === stepIndex && !isDone ? "is-active" : i < stepIndex ? "is-past" : ""}`}
            >
              <div
                className="exam-visual"
                dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 320 260" aria-hidden="true">${step.svg}</svg>` }}
              />
              <div>
                <div className="exam-step-num">Step {i + 1} of {STEPS.length}</div>
                <h2>{step.title}</h2>
                <p className="exam-summary">{step.summary}</p>
              </div>
            </article>
          ))}

          {/* Completion Overlay */}
          <div className={`exam-done ${isDone ? "is-visible" : ""}`}>
            <h2>Check complete</h2>
            <p>Nice work. Repeat this once a month, and see a doctor if you notice anything new or different.</p>
            <div className="exam-done-actions">
              <Link href="/" className="btn-done-primary">
                Back to CheckHub
              </Link>
              <button type="button" className="btn-done-outline" onClick={() => goToStep(0)}>
                Start again
              </button>
            </div>
          </div>
        </section>

        {/* Controls */}
        <div className="exam-controls">
          <span className="exam-time">
            {formatTime(totalElapsedMs)} / {formatTime(TOTAL_MS)}
          </span>
          <div className="exam-buttons">
            <button type="button" className="exam-btn" onClick={handlePrev} aria-label="Previous step">
              <svg viewBox="0 0 24 24">
                <path d="M6 5h2v14H6zM20 5v14L9 12z" />
              </svg>
            </button>
            <button
              type="button"
              className="exam-btn play"
              onClick={togglePlay}
              aria-label={playing && !isDone ? "Pause" : "Play"}
            >
              <svg viewBox="0 0 24 24">
                {playing && !isDone ? (
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                ) : (
                  <path d="M7 4l13 8-13 8z" />
                )}
              </svg>
            </button>
            <button type="button" className="exam-btn" onClick={handleNext} aria-label="Next step">
              <svg viewBox="0 0 24 24">
                <path d="M16 5h2v14h-2zM4 5l11 7-11 7z" />
              </svg>
            </button>
          </div>
          <span className="exam-step-label">Step {stepIndex + 1} of {STEPS.length}</span>
        </div>

        {/* Spotify-style Lyrics Panel */}
        <section className="lyrics-panel" style={{ backgroundColor: currentStep.color }}>
          <div className="lyrics-panel-head">
            <span>Instructions</span>
            <span>{currentStep.title}</span>
          </div>
          <div className="lyrics-scroll" ref={lyricsScrollRef}>
            <div className="lyrics-list">
              {currentStep.lines.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  className={`lyric-line ${i === activeLine && !isDone ? "is-active" : i < activeLine ? "is-past" : ""}`}
                  onClick={() => jumpToLine(i)}
                >
                  {line}
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
