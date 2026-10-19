'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface ExamStep {
  id: number;
  title: string;
  subtitle: string;
  duration: number; // seconds
  instructions: string[];
  clinicalTip: string;
  icon: string;
}

const EXAM_STEPS: ExamStep[] = [
  {
    id: 1,
    title: 'Visual Inspection: Arms at Sides',
    subtitle: 'Stand relaxed in front of a mirror with good lighting',
    duration: 30,
    instructions: [
      'Examine the general outline, symmetry, and contour of both breasts.',
      'Check for visible dimpling, puckering, or skin changes resembling an orange peel.',
      'Look at your nipples: are they pointing the same way as usual, or is one inverted or pulled inward?',
    ],
    clinicalTip: 'Most breasts are not identical in size. You are looking for new asymmetries or recent changes.',
    icon: '🪞',
  },
  {
    id: 2,
    title: 'Visual Inspection: Arms Overhead',
    subtitle: 'Raise both arms high above your head and clasp your hands',
    duration: 30,
    instructions: [
      'Observe how both breasts lift. Do they move upward smoothly together?',
      'Check underneath the lower fold of each breast for hidden contour irregularities.',
      'Look at the sides and underarms for unusual bulging or retraction.',
    ],
    clinicalTip: 'Raising arms pulls breast ligaments upward, making underlying tethered tumors stand out visibly.',
    icon: '🙌',
  },
  {
    id: 3,
    title: 'Chest Muscle Contraction: Hands on Hips',
    subtitle: 'Place hands firmly on hips and push elbows forward',
    duration: 30,
    instructions: [
      'Press your hips firmly to flex and contract your pectoral muscles.',
      'Bow slightly towards the mirror while continuing to flex.',
      'Look for subtle puckering or skin tethering that only appears when chest muscles are engaged.',
    ],
    clinicalTip: 'Tethering to the underlying chest wall muscle is a key diagnostic indicator in clinical exams.',
    icon: '💪',
  },
  {
    id: 4,
    title: 'Palpation: Circular Technique (Right Breast)',
    subtitle: 'Use the pads of your 3 middle fingers in small coin-sized circles',
    duration: 30,
    instructions: [
      'Raise your right arm behind your head. Use your left hand fingers.',
      'Use 3 pressure levels at each spot: light (surface), medium (middle tissue), firm (chest wall).',
      'Follow an up-and-down vertical strip pattern or circular pattern until the entire breast is covered.',
    ],
    clinicalTip: 'Never lift your fingers off the skin entirely; glide smoothly so no zone is missed.',
    icon: '🩺',
  },
  {
    id: 5,
    title: 'Palpation: Circular Technique (Left Breast)',
    subtitle: 'Repeat the exact circular palpation pattern for your left breast',
    duration: 30,
    instructions: [
      'Raise your left arm behind your head. Use your right hand fingers.',
      'Feel from collarbone down to below the bra line, and from breastbone across to the armpit.',
      'Note any firm marble-like or seed-like hard nodule that does not slide away under pressure.',
    ],
    clinicalTip: 'Normal glandular tissue can feel somewhat lumpy or ropey, especially before periods.',
    icon: '🩺',
  },
  {
    id: 6,
    title: 'Underarm & Nipple Assessment',
    subtitle: 'Check lymph nodes and check for nipple discharge',
    duration: 30,
    instructions: [
      'Feel gently under both armpits for any enlarged, firm, or painless lymph nodes.',
      'Check the "Tail of Spence" tissue that sweeps from the breast into the armpit hollow.',
      'Gently squeeze both nipples to check for any clear, milky, or blood-tinged discharge.',
    ],
    clinicalTip: 'Over 50% of breast cancers begin in the upper-outer quadrant and underarm area.',
    icon: '🔍',
  },
];

export default function ExamPage() {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(EXAM_STEPS[0].duration);
  const [isRunning, setIsRunning] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentStep = EXAM_STEPS[currentStepIdx];

  // Timer countdown
  useEffect(() => {
    if (!isRunning || isCompleted) return;

    if (secondsRemaining <= 0) {
      if (currentStepIdx < EXAM_STEPS.length - 1) {
        setCurrentStepIdx((prev) => prev + 1);
        setSecondsRemaining(EXAM_STEPS[currentStepIdx + 1].duration);
      } else {
        setIsCompleted(true);
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, isRunning, isCompleted, currentStepIdx]);

  const handleNext = () => {
    if (currentStepIdx < EXAM_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      setSecondsRemaining(EXAM_STEPS[nextIdx].duration);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      setSecondsRemaining(EXAM_STEPS[prevIdx].duration);
      setIsCompleted(false);
    }
  };

  const handleRestart = () => {
    setCurrentStepIdx(0);
    setSecondsRemaining(EXAM_STEPS[0].duration);
    setIsRunning(true);
    setIsCompleted(false);
  };

  return (
    <div className="dark-theme" style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #1a1206 0%, #000 60%)' }}>
      {/* Exam Header */}
      <header className="exam-header">
        <Link href="/" className="exam-back">
          ← Back to CheckHub
        </Link>
        <div className="site-logo-badge">
          <span className="logo-text">Check</span>
          <span className="hub-pill">Hub</span>
        </div>
        <Link href="/admin" className="exam-back" style={{ borderColor: 'rgba(255, 144, 0, 0.4)', color: 'var(--hub-orange)' }}>
          Admin Panel ↗
        </Link>
      </header>

      <main className="exam-main">
        <div className="exam-heading">
          <h1>3-Minute Guided Breast Examination</h1>
          <p>Six clinical steps designed by breast surgical oncologists. Perform this monthly.</p>
        </div>

        {/* Progress Bar Segments */}
        <div className="exam-progress">
          {EXAM_STEPS.map((step, idx) => {
            const isFinished = idx < currentStepIdx || isCompleted;
            const isCurrent = idx === currentStepIdx && !isCompleted;
            const width = isFinished
              ? '100%'
              : isCurrent
              ? `${((step.duration - secondsRemaining) / step.duration) * 100}%`
              : '0%';
            return (
              <div
                key={step.id}
                className="exam-progress-seg"
                onClick={() => {
                  setCurrentStepIdx(idx);
                  setSecondsRemaining(step.duration);
                  setIsCompleted(false);
                }}
                title={`Jump to Step ${step.id}`}
              >
                <span style={{ width, transition: 'width 0.2s linear' }} />
              </div>
            );
          })}
        </div>

        {!isCompleted ? (
          <div
            style={{
              background: 'linear-gradient(145deg, #17171d 0%, #0e0e12 100%)',
              border: '1px solid var(--border-light)',
              borderRadius: '16px',
              padding: '2.5rem 2rem',
              maxWidth: '850px',
              margin: '0 auto',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Step Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--hub-orange)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                  Step {currentStep.id} of {EXAM_STEPS.length}
                </span>
                <h2 style={{ fontSize: '1.65rem', color: '#fff', marginTop: '0.2rem' }}>
                  {currentStep.icon} {currentStep.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{currentStep.subtitle}</p>
              </div>

              {/* Timer Badge */}
              <div
                style={{
                  background: 'rgba(255, 144, 0, 0.12)',
                  border: '1px solid rgba(255, 144, 0, 0.35)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--hub-orange)' }}>
                  00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
                </span>
              </div>
            </div>

            {/* Checklist */}
            <div style={{ margin: '1.75rem 0', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {currentStep.instructions.map((ins, i) => (
                <div
                  key={i}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    padding: '1rem 1.25rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: 'var(--hub-orange)', fontWeight: 800 }}>✓</span>
                  <span>{ins}</span>
                </div>
              ))}
            </div>

            {/* Clinical Tip */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '8px',
                padding: '0.85rem 1.25rem',
                color: '#bae6fd',
                fontSize: '0.88rem',
                marginBottom: '2rem',
                display: 'flex',
                gap: '0.6rem',
              }}
            >
              <span>💡</span>
              <span>
                <strong>Clinical Fact:</strong> {currentStep.clinicalTip}
              </span>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  {isRunning ? '⏸️ Pause Timer' : '▶️ Resume Timer'}
                </button>
                <button
                  onClick={handlePrev}
                  disabled={currentStepIdx === 0}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  ← Previous
                </button>
              </div>

              <button
                onClick={handleNext}
                className="admin-btn admin-btn-primary"
                style={{ padding: '0.6rem 1.5rem', fontSize: '0.95rem' }}
              >
                {currentStepIdx < EXAM_STEPS.length - 1 ? 'Next Step →' : 'Complete Exam 🎉'}
              </button>
            </div>
          </div>
        ) : (
          /* Completed Screen */
          <div
            style={{
              background: 'linear-gradient(145deg, #17171d 0%, #0e0e12 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '16px',
              padding: '3rem 2rem',
              maxWidth: '750px',
              margin: '0 auto',
              textAlign: 'center',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', color: '#fff', letterSpacing: '1px' }}>
              Exam Completed! You Took Action Today
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', margin: '0.75rem auto 2rem', lineHeight: 1.6 }}>
              Congratulations on completing your monthly routine. Routine self-awareness is how early irregularities are discovered before they spread.
            </p>

            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '1.25rem',
                borderRadius: '10px',
                marginBottom: '2rem',
                textAlign: 'left',
              }}
            >
              <h4 style={{ color: '#10b981', marginBottom: '0.5rem', fontWeight: 800 }}>
                What If You Felt Something Unusual?
              </h4>
              <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Do not panic: 8 out of 10 breast lumps are benign (non-cancerous). Schedule an appointment with your primary physician or gynecologist for a clinical breast exam and diagnostic ultrasound/mammogram.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleRestart} className="admin-btn admin-btn-secondary" style={{ padding: '0.8rem 1.4rem' }}>
                🔄 Restart Examination
              </button>
              <Link href="/" className="admin-btn admin-btn-primary" style={{ padding: '0.8rem 1.6rem', textDecoration: 'none' }}>
                ← Return to CheckHub
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
