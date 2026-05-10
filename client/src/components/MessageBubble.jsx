import React from 'react';
import { API_URL } from '../utils/api.js';

export default function MessageBubble({ message, isOwn, onImageClick }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const imageUrl = message.image?.startsWith('http') ? message.image : `${API_URL}${message.image}`;

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4 slide-in`}>
      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
        isOwn 
          ? 'bg-primary text-white rounded-tr-none' 
          : 'bg-dark-card text-gray-200 border border-dark-border rounded-tl-none'
      }`}>
        <div className="flex flex-col gap-1">
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.image && (
            <div 
              onClick={() => onImageClick(imageUrl)}
              className={`mt-2 rounded-xl overflow-hidden border cursor-pointer group relative ${isOwn ? 'border-white/20' : 'border-dark-border'}`}
            >
              <img 
                src={imageUrl} 
                alt="Shared" 
                className="max-w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          )}

          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isOwn ? 'text-white/60 justify-end' : 'text-secondary-text'}`}>
            <span>{time}</span>
            {isOwn && (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
