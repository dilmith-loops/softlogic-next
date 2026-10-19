'use client';

import React from 'react';

interface SubNavProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  totalCount: number;
}

export const SubNav: React.FC<SubNavProps> = ({
  activeCategory,
  onSelectCategory,
  totalCount,
}) => {
  const categories = [
    { id: 'all', label: `All Videos (${totalCount})`, icon: '🔥' },
    { id: 'self-exam', label: 'Self-Exam Techniques', icon: '🧴' },
    { id: 'symptoms', label: 'Warning Signs & Lumps', icon: '🔍' },
    { id: 'mammogram', label: 'Mammography & Clinical', icon: '🏥' },
    { id: 'male-cancer', label: 'Male Breast Health', icon: '👨' },
    { id: 'myths', label: 'Myths vs Facts', icon: '💡' },
    { id: 'top-rated', label: 'Top Rated Checks', icon: '⭐' },
  ];

  return (
    <nav className="sub-nav">
      <div className="sub-nav-container">
        {categories.map((c) => (
          <button
            key={c.id}
            className={`nav-tab ${activeCategory === c.id ? 'active' : ''}`}
            onClick={() => onSelectCategory(c.id)}
          >
            <span className="tab-icon">{c.icon}</span> {c.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
