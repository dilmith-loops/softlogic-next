'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenSelfCheck: () => void;
  onOpenReminder: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch,
  onOpenSelfCheck,
  onOpenReminder,
  onOpenShare,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <header className="hub-header">
      <div className="header-container">
        {/* Brand Logo */}
        <Link href="/" className="brand-logo" title="CheckHub Home">
          <div className="site-logo-badge">
            <span className="logo-text">Check</span>
            <span className="hub-pill">Hub</span>
          </div>
          <span className="badge-sub">AWARENESS</span>
        </Link>

        {/* Search Bar */}
        <form className="search-section" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="searchInput"
              placeholder="Search self-exam guides, symptoms, lump detection, mammograms..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value === '') onSearch('');
              }}
              autoComplete="off"
            />
            {searchTerm && (
              <button
                type="button"
                id="clearSearchBtn"
                className="clear-search-btn"
                title="Clear"
                onClick={handleClear}
              >
                ✕
              </button>
            )}
            <button type="submit" id="searchBtn" className="search-submit-btn">
              SEARCH
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="header-actions">
          <button id="btnSelfCheckModal" className="action-btn highlight" onClick={onOpenSelfCheck}>
            <span className="btn-icon">🩺</span>
            <span>Self-Check Guide</span>
          </button>
          <button id="btnSetReminder" className="action-btn reminder-btn" onClick={onOpenReminder}>
            <span className="btn-icon">📅</span>
            <span>Set Reminder</span>
          </button>
          <button id="btnShareCampaign" className="action-btn share-btn" onClick={onOpenShare} title="Share Campaign">
            <span className="btn-icon">📢</span>
            <span>Share</span>
          </button>
          <Link href="/admin" className="action-btn" style={{ background: 'rgba(255, 144, 0, 0.12)', border: '1px solid rgba(255, 144, 0, 0.35)', color: 'var(--hub-orange)' }}>
            <span className="btn-icon">🔐</span>
            <span>Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
