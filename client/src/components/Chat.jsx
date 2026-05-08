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
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);

  // Mobile state: if true, we show the chat window; if false, we show the user list.
  const [isChatOpen, setIsChatOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Notifications
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const url = selectedUser 
          ? `${API_URL}/api/messages?recipientId=${selectedUser._id}`
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

  // Socket setup
  useEffect(() => {
    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    s.on('newMessage', (msg) => {
      // Check if message belongs to current chat
      const isGlobalMsg = !msg.recipient && !selectedUser;
      const isPrivateMsg = selectedUser && (
        (msg.sender === selectedUser._id && msg.recipient === user.id) ||
        (msg.sender === user.id && msg.recipient === selectedUser._id)
      );

      if (isGlobalMsg || isPrivateMsg) {
        setMessages((prev) => [...prev, msg]);
      } else if (msg.sender !== user.id) {
        // Show notification for messages in other rooms
        showToast(msg);
      }
    });

    s.on('onlineUsers', (users) => {
      // FIX: use 'u.id' instead of 'u.userId' to correctly filter yourself out
      setOnlineUsers(users.filter(u => u.id !== user.id));
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
      recipientId: selectedUser?._id || null,
    });
    setNewMessage('');
    socket.emit('stopTyping');
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    setIsChatOpen(true);
  };

  return (
    <div className="chat-container">
      {/* Sidebar: hidden on mobile when chat is open */}
      <div className={`sidebar ${isChatOpen ? 'hidden' : ''}`}>
        <div className="user-profile">
          <div className="avatar">{user.username[0].toUpperCase()}</div>
          <div style={{ marginLeft: '12px', flex: 1 }}>
            <h3>{user.username}</h3>
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>

        <div className="users-list">
          <div className={`user-item ${!selectedUser ? 'active' : ''}`} onClick={() => selectUser(null)}>
            <div className="avatar" style={{ background: '#334155' }}>#</div>
            <div className="user-details">
              <h4>Global Chat</h4>
              <p>Public Room</p>
            </div>
          </div>

          <div className="section-title">PRIVATE MESSAGES</div>
          {filteredUsers.map((u) => (
            <div 
              key={u.id} 
              className={`user-item ${selectedUser?._id === u.id ? 'active' : ''}`}
              onClick={() => selectUser({ _id: u.id, username: u.username })}
            >
              <div className="avatar" style={{ background: `hsl(${u.username.length * 40}, 60%, 50%)` }}>
                {u.username[0].toUpperCase()}
              </div>
              <div className="user-details">
                <h4>{u.username}</h4>
                <p>Click to chat privately</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-chat">
        <header className="chat-header">
          <button className="back-btn" onClick={() => setIsChatOpen(false)}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="avatar">
            {selectedUser ? selectedUser.username[0].toUpperCase() : '#'}
          </div>
          <div className="header-info" style={{ marginLeft: '12px' }}>
            <h2>{selectedUser ? selectedUser.username : 'Global Chat'}</h2>
            <p style={{ fontSize: '12px', color: 'var(--wa-text-secondary)' }}>
              {typingUsers.size > 0 ? 'Typing...' : (selectedUser ? 'Online' : 'Public Group')}
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
            socket.emit('sendMessage', { image: imageUrl, recipientId: selectedUser?._id || null });
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
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="notification-toast" onClick={() => selectUser({ _id: notification.sender, username: notification.senderName })}>
          <strong>New message from {notification.senderName}</strong>
          <p style={{ fontSize: '12px', color: 'var(--wa-text-secondary)' }}>
            {notification.content || 'Sent an image'}
          </p>
        </div>
      )}
    </div>
  );
}
