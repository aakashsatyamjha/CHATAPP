import React from 'react';

export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className={`message-wrapper ${isOwn ? 'own' : ''} slide-in`}>
      <div className="message-bubble">
        {!isOwn && (
          <div style={{ color: 'var(--wa-teal)', fontSize: '12px', fontWeight: 'bold', marginBottom: '2px' }}>
            {message.senderName}
          </div>
        )}
        
        {message.content && <div className="text">{message.content}</div>}
        
        {message.image && (
          <div className="image-preview" style={{ marginTop: '5px', borderRadius: '8px', overflow: 'hidden' }}>
            <img src={message.image} alt="shared" style={{ maxWidth: '100%', display: 'block' }} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '2px' }}>
          <div className="message-time" style={{ margin: 0 }}>{time}</div>
          {isOwn && (
            <div className="message-status">
              <span className="tick">✓✓</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
