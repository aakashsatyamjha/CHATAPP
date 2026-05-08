import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [selectedUser, setSelectedUser] = useState(null); // null means Global Chat
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Socket connection
  useEffect(() => {
    const s = io(SOCKET_URL, {
      auth: { token },
    });

    setSocket(s);

    s.on('newMessage', (msg) => {
      // Logic for adding message to UI
      const isGlobalMsg = !msg.recipient && !selectedUser;
      const isPrivateMsg = selectedUser && (
        (msg.sender === selectedUser._id && msg.recipient === user.id) ||
        (msg.sender === user.id && msg.recipient === selectedUser._id)
      );

      if (isGlobalMsg || isPrivateMsg) {
        setMessages((prev) => [...prev, msg]);
      }
      
      // Notification logic
      if (msg.sender !== user.id) {
        if ('Notification' in window && window.Notification.permission === 'granted') {
          new window.Notification(`New from ${msg.senderName}`, {
            body: msg.content || 'Sent an image',
          });
        }
      }
    });

    s.on('onlineUsers', (users) => {
      // Filter out self
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

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket) {
      if (e.target.value.length > 0) {
        socket.emit('typing');
      } else {
        socket.emit('stopTyping');
      }
    }
  };

  return (
    <div className="chat-container">
      <div className="sidebar">
        <div className="user-profile">
          <div className="avatar">{user.username[0]}</div>
          <div className="user-info">
            <h3>{user.username}</h3>
            <span className="status">Online</span>
          </div>
          <button onClick={logout} className="logout-btn" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>

        <div className="users-list">
          <div 
            className={`user-item ${!selectedUser ? 'active' : ''}`}
            onClick={() => setSelectedUser(null)}
          >
            <div className="avatar global">#</div>
            <div className="user-info">
              <h4>Global Chat</h4>
              <p>Public Room</p>
            </div>
          </div>

          <div className="section-title">Private Messages</div>
          {onlineUsers.length === 0 && <p className="no-users">No other users online</p>}
          {onlineUsers.map((u) => (
            <div 
              key={u.userId} 
              className={`user-item ${selectedUser?._id === u.userId ? 'active' : ''}`}
              onClick={() => setSelectedUser({ _id: u.userId, username: u.username })}
            >
              <div className="avatar">{u.username[0]}</div>
              <div className="user-info">
                <h4>{u.username}</h4>
                <p>Online</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="main-chat">
        <div className="chat-header">
          <div className="header-text">
            <h2>{selectedUser ? `Chat with ${selectedUser.username}` : 'Global Chat'}</h2>
            <p className="status-text">
              {selectedUser ? 'Private Conversation' : 'Public Room'}
            </p>
          </div>
          <div className="typing-indicator-text">
            {typingUsers.size > 0 && `${Array.from(typingUsers).join(', ')} is typing...`}
          </div>
        </div>

        <div className="messages-area">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>No messages here yet. Start the conversation!</p>
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

        <form className="message-form" onSubmit={handleSendMessage}>
          <ImageUpload onImageReady={(imageUrl) => {
            socket.emit('sendMessage', { 
              image: imageUrl,
              recipientId: selectedUser?._id || null 
            });
          }} />
          <input
            type="text"
            placeholder={selectedUser ? `Message ${selectedUser.username}...` : "Type a message..."}
            value={newMessage}
            onChange={handleTyping}
            autoComplete="off"
          />
          <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
