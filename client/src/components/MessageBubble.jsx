import React from 'react';

export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const initials = message.senderName
    ? message.senderName.slice(0, 2).toUpperCase()
    : '??';

  // Generate consistent color from username
  const hue = message.senderName
    ? message.senderName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    : 200;

  return (
    <div className={`message-row ${isOwn ? 'own' : ''}`}>
      {!isOwn && (
        <div
          className="message-avatar"
          style={{ background: `hsl(${hue}, 60%, 45%)` }}
        >
          {initials}
        </div>
      )}
      <div className={`message-bubble ${isOwn ? 'own' : ''}`}>
        {!isOwn && <div className="message-sender">{message.senderName}</div>}
        {message.image && (
          <div className="message-image-wrapper">
            <img
              src={message.image}
              alt="shared"
              className="message-image"
              loading="lazy"
              onClick={() => window.open(message.image, '_blank')}
            />
          </div>
        )}
        {message.content && <p className="message-text">{message.content}</p>}
        <span className="message-time">{time}</span>
      </div>
    </div>
  );
}
