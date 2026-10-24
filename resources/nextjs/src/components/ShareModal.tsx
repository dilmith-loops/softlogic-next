'use client';

import React, { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://checkhub.org';
  const shareText = encodeURIComponent(
    '1 in 8 women will be diagnosed with breast cancer. Early detection saves lives. Learn the monthly touch routine on CheckHub:'
  );

  const handleCopy = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`${decodeURIComponent(shareText)} ${currentUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="video-modal-dialog" style={{ maxWidth: '520px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-brand">
            <span className="logo-text">Check</span>
            <span className="hub-pill">Hub</span>
            <span className="modal-title-pill">SHARE TO SAVE A LIFE</span>
          </div>
          <button onClick={onClose} className="action-btn" style={{ background: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}>
            ✕ Close
          </button>
        </div>

        <div style={{ padding: '2rem 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2.8rem' }}>📢</span>
            <h3 style={{ color: '#fff', fontSize: '1.3rem', marginTop: '0.4rem' }}>Prank A Friend, Save A Life</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.35rem', lineHeight: 1.5 }}>
              CheckHub looks provocative at first glance, but delivers vital life-saving knowledge. Share this link to surprise your friends and get them checking!
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <a
              href={`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
              style={{ justifyContent: 'center', padding: '0.75rem', textDecoration: 'none' }}
            >
              💬 Share via WhatsApp
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
              style={{ justifyContent: 'center', padding: '0.75rem', textDecoration: 'none' }}
            >
              🐦 Share on X (Twitter)
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
              style={{ justifyContent: 'center', padding: '0.75rem', textDecoration: 'none' }}
            >
              📘 Share on Facebook
            </a>
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="admin-form-input"
              style={{ paddingRight: '90px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
            <button
              onClick={handleCopy}
              className="admin-btn admin-btn-primary"
              style={{
                position: 'absolute',
                right: '4px',
                top: '4px',
                bottom: '4px',
                padding: '0 0.85rem',
                fontSize: '0.8rem',
              }}
            >
              {copied ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
