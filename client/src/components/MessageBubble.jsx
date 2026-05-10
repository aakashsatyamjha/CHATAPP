import React, { useState, useRef, useEffect } from 'react';
import { API_URL } from '../utils/api.js';

export default function MessageBubble({ message, isOwn, onImageClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const time = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });

  const imageUrl = message.image?.startsWith('http') ? message.image : `${API_URL}${message.image}`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} mb-4 slide-in relative group`}>
      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative ${
        isOwn 
          ? 'bg-primary text-white rounded-tr-none' 
          : 'bg-dark-card text-gray-200 border border-dark-border rounded-tl-none'
      }`}>
        {/* Delete Menu Button - Visible on Mobile/Desktop */}
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={`absolute top-2 ${isOwn ? '-left-8' : '-right-8'} p-1 text-gray-500 hover:text-white transition-all md:opacity-0 md:group-hover:opacity-100 bg-dark-bg/50 rounded-full border border-dark-border`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <div 
            ref={menuRef}
            className={`absolute z-30 bottom-full ${isOwn ? 'right-0' : 'left-0'} mb-2 w-40 bg-dark-header border border-dark-border rounded-xl shadow-2xl p-1 animate-in fade-in zoom-in duration-100`}
          >
            <button 
              onClick={() => { onDelete(message._id, 'me'); setShowMenu(false); }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Delete for me
            </button>
            {isOwn && (
              <button 
                onClick={() => { onDelete(message._id, 'everyone'); setShowMenu(false); }}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
                </svg>
                Delete for everyone
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1">
          {message.content && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {message.image && (
            <div 
              onClick={() => onImageClick(imageUrl)}
              className={`mt-2 rounded-xl overflow-hidden border cursor-pointer group/img relative ${isOwn ? 'border-white/20' : 'border-dark-border'}`}
            >
              <img 
                src={imageUrl} 
                alt="Shared" 
                className="max-w-full h-auto object-cover transition-transform duration-500 group-hover/img:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100">
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
