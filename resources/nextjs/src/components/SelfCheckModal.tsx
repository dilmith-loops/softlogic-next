'use client';

import React from 'react';
import Link from 'next/link';
import { StethoscopeIcon } from '@/components/StethoscopeIcon';

interface SelfCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelfCheckModal: React.FC<SelfCheckModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const steps = [
    {
      num: '01',
      title: 'In Front of The Mirror (Visual Inspection)',
      desc: 'Look at your breasts with arms at sides, then with arms raised high overhead. Check for any skin dimpling, swelling, redness, or nipple retraction.',
    },
    {
      num: '02',
      title: 'Hands on Hips (Chest Muscle Contraction)',
      desc: 'Press your palms firmly against your hips and flex your chest muscles forward. Subtle contour changes or puckering become prominent.',
    },
    {
      num: '03',
      title: 'Shower Palpation (Circular Motion)',
      desc: 'Soapy wet skin reduces friction. Use the flat pads of your 3 middle fingers to make small coin-sized overlapping circles across each breast.',
    },
    {
      num: '04',
      title: 'Check The Underarm & Tail of Spence',
      desc: '50% of breast tumors occur in the upper-outer quadrant extending into the armpit. Sweep fingers from breast tissue up into the hollow of the armpit.',
    },
    {
      num: '05',
      title: 'Gentle Nipple Check',
      desc: 'Inspect both nipples for scaling, inversion, or spontaneous fluid discharge.',
    },
  ];

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="video-modal-dialog" style={{ maxWidth: '780px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-brand">
            <span className="logo-text">Check</span>
            <span className="hub-pill">Hub</span>
            <span className="modal-title-pill">5-STEP CLINICAL SELF-EXAM GUIDE</span>
          </div>
          <button onClick={onClose} className="action-btn" style={{ background: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}>
            ✕ Close
          </button>
        </div>

        <div style={{ padding: '2rem 1.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            Breast self-exams help you become familiar with how your breasts look and feel so you can detect any change early. Repeat this routine once every month.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {steps.map((st) => (
              <div
                key={st.num}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  display: 'flex',
                  gap: '1.25rem',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.8rem',
                    color: 'var(--hub-orange)',
                    lineHeight: 1,
                  }}
                >
                  {st.num}
                </div>
                <div>
                  <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '0.35rem' }}>{st.title}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>{st.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              href="/exam"
              className="action-btn highlight"
              style={{ padding: '0.8rem 1.5rem', textDecoration: 'none', fontWeight: 800 }}
              onClick={onClose}
            >
              <StethoscopeIcon size={18} color="currentColor" style={{ marginRight: '6px' }} /> Launch 3-Minute Interactive Exam
            </Link>
            <button
              onClick={onClose}
              className="action-btn"
              style={{ padding: '0.8rem 1.5rem', background: 'rgba(255, 255, 255, 0.08)' }}
            >
              Done Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
