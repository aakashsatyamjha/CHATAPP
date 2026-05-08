import React from 'react';

export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`message-wrapper ${isOwn ? 'own' : ''}`}>
      {!isOwn && <span className="sender-name">{message.senderName}</span>}
      <div className="message-bubble">
        {message.content && <p>{message.content}</p>}
        {message.image && (
          <div className="image-preview-container">
            <img src={message.image} alt="shared" />
          </div>
        )}
        <div className="message-time">{time}</div>
      </div>
    </div>
  );
}
