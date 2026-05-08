import React, { useEffect, useState } from 'react';

export default function Notification({ notifications, removeNotification }) {
  return (
    <div className="notification-container" id="notification-container">
      {notifications.map((n) => (
        <NotificationToast key={n.id} notification={n} onClose={() => removeNotification(n.id)} />
      ))}
    </div>
  );
}

function NotificationToast({ notification, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification-toast ${exiting ? 'exit' : ''}`}>
      <div className="notification-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="notification-body">
        <strong>{notification.senderName}</strong>
        <p>{notification.content || '📷 Sent an image'}</p>
      </div>
      <button className="notification-close" onClick={() => { setExiting(true); setTimeout(onClose, 300); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
