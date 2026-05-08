import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import Notification from './Notification.jsx';
import ImageUpload from './ImageUpload.jsx';
import { API_URL, SOCKET_URL } from '../utils/api.js';

export default function Chat() {
  const { user, token, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const notifIdRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const addNotification = useCallback((msg) => {
    const id = ++notifIdRef.current;
    setNotifications((prev) => [...prev.slice(-4), { ...msg, id }]);

    // Browser notification
    if (document.hidden && Notification.permission === 'granted') {
      new window.Notification(`${msg.senderName}`, {
        body: msg.content || '📷 Sent an image',
        icon: '/favicon.ico',
      });
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && window.Notification.permission === 'default') {
      window.Notification.requestPermission();
    }
  }, []);

  // Load message history
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/api/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
  }, [token]);

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('newMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.sender !== user.id) {
        addNotification(msg);
      }
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    socket.on('userTyping', ({ username }) => {
      setTypingUsers((prev) => {
        if (prev.includes(username)) return prev;
        return [...prev, username];
      });
    });

    socket.on('userStopTyping', ({ username }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== username));
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user.id, addNotification]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.emit('sendMessage', { content: input.trim() });
    socketRef.current.emit('stopTyping');
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Typing indicator
    if (socketRef.current) {
      socketRef.current.emit('typing');
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('stopTyping');
      }, 1500);
    }
  };

  const handleImageReady = (imageUrl) => {
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', { image: imageUrl });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSend(e);
    }
  };

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length > 1
      ? `${typingUsers.length} people are typing...`
      : '';

  return (
    <div className="chat-layout">
      {/* Notification toasts */}
      <Notification notifications={notifications} removeNotification={removeNotification} />

      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-small">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>Pulse Chat</span>
          </div>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="sidebar-section">
          <h3>
            <span className={`status-dot ${connected ? 'online' : 'offline'}`}></span>
            Online — {onlineUsers.length}
          </h3>
          <ul className="user-list" id="online-users-list">
            {onlineUsers.map((u) => (
              <li key={u.id} className="user-item">
                <div
                  className="user-avatar"
                  style={{
                    background: `hsl(${u.username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 60%, 45%)`,
                  }}
                >
                  {u.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="user-name">
                  {u.username}
                  {u.id === user.id && <span className="you-badge">you</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-footer">
          <div className="current-user">
            <div
              className="user-avatar"
              style={{
                background: `hsl(${user.username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 60%, 45%)`,
              }}
            >
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="current-user-info">
              <span className="current-user-name">{user.username}</span>
              <span className="current-user-email">{user.email}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} id="logout-btn" title="Sign Out">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main chat area */}
      <main className="chat-main">
        <header className="chat-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)} id="sidebar-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="header-info">
            <h2>General Chat</h2>
            <span className="header-meta">
              {connected ? `${onlineUsers.length} online` : 'Connecting...'}
            </span>
          </div>
          <div className="header-actions">
            <span className={`connection-indicator ${connected ? 'connected' : ''}`}></span>
          </div>
        </header>

        <div className="chat-messages" id="chat-messages">
          {messages.length === 0 && (
            <div className="empty-chat">
              <div className="empty-chat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3>No messages yet</h3>
              <p>Be the first to say something!</p>
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.sender === user.id}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {typingText && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            {typingText}
          </div>
        )}

        <form className="chat-input-bar" onSubmit={handleSend} id="message-form">
          <ImageUpload onImageReady={handleImageReady} />
          <input
            type="text"
            className="chat-input"
            placeholder="Type a message..."
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            id="message-input"
            autoComplete="off"
          />
          <button type="submit" className="send-btn" disabled={!input.trim()} id="send-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}
