import React from 'react';

export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className={`message-wrapper ${isOwn ? 'own' : ''}`}>
      <div className="message-bubble">
        {!isOwn && message.recipient === null && (
          <div style={{ color: '#00a884', fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
            {message.senderName}
          </div>
        )}
        {message.content && <div className="text">{message.content}</div>}
        {message.image && (
          <div className="image-preview" style={{ marginTop: '5px', borderRadius: '4px', overflow: 'hidden' }}>
            <img src={message.image} alt="shared" style={{ maxWidth: '100%', display: 'block' }} />
          </div>
        )}
        <div className="message-time">{time}</div>
      </div>
    </div>
  );
}
