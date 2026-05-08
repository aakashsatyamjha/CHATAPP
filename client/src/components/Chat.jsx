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
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  useEffect(() => {
    const s = io(SOCKET_URL, {
      auth: { token },
    });

    setSocket(s);

    s.on('newMessage', (msg) => {
      const isGlobalMsg = !msg.recipient && !selectedUser;
      const isPrivateMsg = selectedUser && (
        (msg.sender === selectedUser._id && msg.recipient === user.id) ||
        (msg.sender === user.id && msg.recipient === selectedUser._id)
      );

      if (isGlobalMsg || isPrivateMsg) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    s.on('onlineUsers', (users) => {
      setOnlineUsers(users.filter(u => u.userId !== user.id));
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

  const filteredUsers = onlineUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="user-profile">
          <div className="avatar">{user.username[0].toUpperCase()}</div>
          <div className="header-actions">
             <button onClick={logout} className="logout-btn" title="Logout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>

        <div className="sidebar-search">
          <div className="search-inner">
            <svg viewBox="0 0 24 24" width="18" fill="none" stroke="#8696a0" strokeWidth="2">
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
          <div 
            className={`user-item ${!selectedUser ? 'active' : ''}`}
            onClick={() => setSelectedUser(null)}
          >
            <div className="avatar global">#</div>
            <div className="user-details">
              <h4>Global Chat</h4>
              <p>Public Room</p>
            </div>
          </div>

          <div className="section-title">CHATS</div>
          {filteredUsers.map((u) => (
            <div 
              key={u.userId} 
              className={`user-item ${selectedUser?._id === u.userId ? 'active' : ''}`}
              onClick={() => setSelectedUser({ _id: u.userId, username: u.username })}
            >
              <div className="avatar">{u.username[0].toUpperCase()}</div>
              <div className="user-details">
                <h4>{u.username}</h4>
                <p>Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="main-chat">
        <header className="chat-header">
          <div className="avatar">
            {selectedUser ? selectedUser.username[0].toUpperCase() : '#'}
          </div>
          <div className="header-info">
            <h2>{selectedUser ? selectedUser.username : 'Global Chat'}</h2>
            <p className="status-text">
              {typingUsers.size > 0 
                ? `${Array.from(typingUsers).join(', ')} is typing...` 
                : (selectedUser ? 'Online' : 'Public Group')}
            </p>
          </div>
        </header>

        <div className="messages-area">
          {messages.map((msg) => (
            <MessageBubble 
              key={msg._id} 
              message={msg} 
              isOwn={msg.sender === user.id} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={handleSendMessage}>
          <ImageUpload onImageReady={(imageUrl) => {
            socket.emit('sendMessage', { 
              image: imageUrl,
              recipientId: selectedUser?._id || null 
            });
          }} />
          <input
            type="text"
            placeholder="Type a message"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (socket) socket.emit(e.target.value ? 'typing' : 'stopTyping');
            }}
          />
          <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M1.101,21.757L23.8,12.028L1.101,2.3L1.1,10.136l13.569,1.892L1.1,13.921L1.101,21.757z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
