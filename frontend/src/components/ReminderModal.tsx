'use client';

import React, { useState } from 'react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ isOpen, onClose }) => {
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownloadICS = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CheckHub//Breast Cancer Awareness Routine//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:CheckHub - Monthly 3-Minute Breast Self-Check Routine
DESCRIPTION:Life-saving monthly touch guide. Perform circular palpation and mirror visual inspection. Early detection brings survival rates up to 99%. Learn more at CheckHub.
RRULE:FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Time for your monthly CheckHub self-exam!
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `checkhub_monthly_reminder_day_${dayOfMonth}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="video-modal-dialog" style={{ maxWidth: '560px' }}>
        <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-brand">
            <span className="logo-text">Check</span>
            <span className="hub-pill">Hub</span>
            <span className="modal-title-pill">MONTHLY CALENDAR REMINDER</span>
          </div>
          <button onClick={onClose} className="action-btn" style={{ background: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}>
            ✕ Close
          </button>
        </div>

        <div style={{ padding: '2rem 1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '3rem' }}>📅</span>
            <h3 style={{ color: '#fff', fontSize: '1.35rem', marginTop: '0.5rem' }}>Never Miss Your Monthly Routine</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
              Doctors advise checking on days 7 to 10 after your period starts, or choosing a fixed date each month if post-menopausal.
            </p>
          </div>

          <div className="admin-form-group">
            <label>Select Day of The Month to Remind You:</label>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(parseInt(e.target.value))}
              className="admin-select"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  Day {d} of every month
                </option>
              ))}
            </select>
          </div>

          {downloaded && (
            <div className="admin-alert-box admin-alert-success" style={{ marginTop: '1rem' }}>
              ✓ Calendar invitation downloaded! Open the file to add to Apple Calendar, Google Calendar, or Outlook.
            </div>
          )}

          <div style={{ marginTop: '1.75rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleDownloadICS}
              className="admin-btn admin-btn-primary admin-btn-block"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              📥 Download Calendar Reminder (.ics)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
