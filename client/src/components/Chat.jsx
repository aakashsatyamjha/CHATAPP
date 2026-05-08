import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import ImageUpload from './ImageUpload.jsx';
import { API_URL, SOCKET_URL } from '../utils/api.js';

export default function Chat() {
  const { user, token, logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data.filter(u => u.id !== user.id));
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    if (token) fetchUsers();
  }, [token, user.id]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser && messages.length > 0) return; // Don't clear if staying on global
      try {
        const url = selectedUser 
          ? `${API_URL}/api/messages?recipientId=${selectedUser.id}`
          : `${API_URL}/api/messages`;
        
        const res = await fetch(url, {
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

    if (token) loadMessages();
  }, [token, selectedUser]);

  useEffect(() => {
    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    s.on('newMessage', (msg) => {
      const isGlobalMsg = !msg.recipient && !selectedUser;
      const isPrivateMsg = selectedUser && (
        (msg.sender === selectedUser.id && msg.recipient === user.id) ||
        (msg.sender === user.id && msg.recipient === selectedUser.id)
      );

      if (isGlobalMsg || isPrivateMsg) {
        setMessages((prev) => [...prev, msg]);
      } else if (msg.sender !== user.id) {
        showToast(msg);
      }
    });

    s.on('onlineUsers', (users) => {
      setOnlineUsers(users.map(u => u.id));
    });

    s.on('userTyping', ({ username }) => {
      setTypingUsers((prev) => new Set(prev).add(username));
    });

    s.on('userStopTyping', ({ username }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(username);
        return next;
      });
    });

    return () => s.disconnect();
  }, [token, selectedUser, user.id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('sendMessage', {
      content: newMessage,
      recipientId: selectedUser?.id || null,
    });
    setNewMessage('');
    socket.emit('stopTyping');
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    setIsChatOpen(true);
    setSearchTerm('');
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className={`sidebar ${isChatOpen ? 'hidden' : ''}`}>
        <div className="user-profile">
          <div className="avatar" style={{ background: '#54656f' }}>
            {user.username[0].toUpperCase()}
          </div>
          <div style={{ marginLeft: '12px', flex: 1 }}>
            <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{user.username}</h3>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '4px' }}>
            <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)} title="Toggle Theme">
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <button onClick={logout} className="logout-btn" title="Logout">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <div className="search-inner">
            <svg viewBox="0 0 24 24" width="18" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search or start new chat" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="users-list">
          <div className={`user-item ${!selectedUser ? 'active' : ''}`} onClick={() => selectUser(null)}>
            <div className="avatar" style={{ background: '#00a884' }}>#</div>
            <div className="user-details">
              <h4>Global Community</h4>
              <p>Public Group Chat</p>
            </div>
          </div>

          <div className="section-title">{searchTerm ? 'Search Results' : 'Contacts'}</div>
          
          {filteredUsers.map((u) => {
            const isOnline = onlineUsers.includes(u.id);
            return (
              <div key={u.id} className={`user-item ${selectedUser?.id === u.id ? 'active' : ''}`} onClick={() => selectUser({ id: u.id, username: u.username })}>
                <div className="avatar" style={{ background: `hsl(${u.username.length * 40}, 60%, 50%)` }}>
                  {u.username[0].toUpperCase()}
                  {isOnline && <div className="online-indicator" />}
                </div>
                <div className="user-details">
                  <h4>{u.username}</h4>
                  <p>{isOnline ? 'Online' : 'Click to message'}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area or Welcome Screen */}
      <div className="main-chat">
        {(!selectedUser && messages.length === 0 && !isChatOpen) ? (
          <div className="welcome-screen">
            <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <h1 style={{ fontSize: '32px', fontWeight: '300' }}>Pulse for Web</h1>
            <p style={{ color: 'var(--wa-text-secondary)', marginTop: '10px', maxWidth: '350px' }}>
              Send and receive messages without keeping your phone online.
            </p>
            <div style={{ marginTop: '40px', fontSize: '14px', color: 'var(--wa-text-secondary)' }}>
              🔒 End-to-end encrypted
            </div>
          </div>
        ) : (
          <>
            <header className="chat-header">
              <button className="back-btn" onClick={() => setIsChatOpen(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="avatar" style={{ background: selectedUser ? `hsl(${selectedUser.username.length * 40}, 60%, 50%)` : '#00a884' }}>
                {selectedUser ? selectedUser.username[0].toUpperCase() : '#'}
              </div>
              <div className="header-info" style={{ marginLeft: '12px' }}>
                <h2>{selectedUser ? selectedUser.username : 'Global Community'}</h2>
                <p style={{ fontSize: '12px', color: 'var(--wa-text-secondary)' }}>
                  {typingUsers.size > 0 ? 'Typing...' : (selectedUser ? (onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline') : 'Public Group')}
                </p>
              </div>
            </header>

            <div className="messages-area">
              {messages.map((msg) => (
                <MessageBubble key={msg._id} message={msg} isOwn={msg.sender === user.id} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form className="message-form" onSubmit={handleSendMessage}>
              <ImageUpload onImageReady={(imageUrl) => {
                socket.emit('sendMessage', { image: imageUrl, recipientId: selectedUser?.id || null });
              }} />
              <input
                type="text"
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (socket) socket.emit(e.target.value ? 'typing' : 'stopTyping');
                }}
                autoComplete="off"
              />
              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M1.101,21.757L23.8,12.028L1.101,2.3L1.1,10.136l13.569,1.892L1.1,13.921L1.101,21.757z" />
                </svg>
              </button>
            </form>
          </>
        )}
      </div>

      {notification && (
        <div className="notification-toast" onClick={() => selectUser({ id: notification.sender, username: notification.senderName })}>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{notification.senderName}</div>
          <div style={{ fontSize: '12px', color: 'var(--wa-text-secondary)' }}>{notification.content || '📷 Photo'}</div>
        </div>
      )}
    </div>
  );
}
