import React from 'react';
import { API_URL } from '../utils/api.js';

export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} slide-in group`}>
      <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name (only for others' messages in group chat) */}
        {!isOwn && !message.recipient && (
          <span className="text-[10px] font-bold text-primary ml-2 mb-1 uppercase tracking-wider">
            {message.senderName}
          </span>
        )}

        <div className={`relative px-4 py-3 rounded-2xl shadow-sm transition-all ${
          isOwn 
            ? 'bg-primary text-white rounded-tr-none shadow-primary/10' 
            : 'bg-dark-card text-gray-100 rounded-tl-none border border-dark-border shadow-black/20'
        }`}>
          {/* Text Content */}
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {/* Image Content */}
          {message.image && (
            <div className={`mt-2 rounded-xl overflow-hidden border ${isOwn ? 'border-white/20' : 'border-dark-border'}`}>
              <img 
                src={message.image.startsWith('http') ? message.image : `${API_URL}${message.image}`} 
                alt="Shared" 
                className="max-w-full h-auto object-cover hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          )}

          {/* Metadata (Time + Status) */}
          <div className={`flex items-center gap-1.5 mt-1.5 justify-end ${isOwn ? 'text-white/70' : 'text-secondary-text'}`}>
            <span className="text-[9px] font-medium uppercase">{time}</span>
            {isOwn && (
              <span className="text-[10px] text-white">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M21 7L9 19L3.5 13.5L4.91 12.09L9 16.17L19.59 5.59L21 7Z" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
