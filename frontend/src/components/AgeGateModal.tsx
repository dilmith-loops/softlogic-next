'use client';

import React from 'react';

interface AgeGateModalProps {
  isOpen: boolean;
  onEnter: () => void;
  onExit: () => void;
}

export const AgeGateModal: React.FC<AgeGateModalProps> = ({ isOpen, onEnter, onExit }) => {
  if (!isOpen) return null;

  return (
    <div className="age-gate-overlay">
      <div className="age-gate-card">
        <div className="site-logo-badge large age-gate-logo">
          <span className="logo-text">Check</span>
          <span className="hub-pill">Hub</span>
        </div>
        <h2>This is an adult website</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          This page delivers life-saving breast cancer awareness and clinical self-check routines. Early detection saves lives.
        </p>
        <div className="age-gate-actions">
          <button id="btnEnterSite" className="btn-gate-outline" onClick={onEnter}>
            I am 18 or older - Enter
          </button>
          <button id="btnSkipToGuide" className="btn-gate-outline" onClick={onExit}>
            I am under 18 - Exit to Awareness
          </button>
        </div>
      </div>
    </div>
  );
};
