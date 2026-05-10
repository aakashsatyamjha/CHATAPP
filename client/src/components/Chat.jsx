import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import MessageBubble from './MessageBubble.jsx';
import ImageUpload from './ImageUpload.jsx';
import { API_URL, SOCKET_URL } from '../utils/api.js';
import { encryptMessage, decryptMessage } from '../utils/encryption.js';

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [zoomedImage, setZoomedImage] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Map _id to id for consistency
          const mappedUsers = data.map(u => ({
            ...u,
            id: u._id
          }));
          setAllUsers(mappedUsers.filter(u => u.id !== user.id));
        }
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };
    if (token) fetchUsers();
  }, [token, user.id]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const url = selectedUser 
          ? `${API_URL}/api/messages?recipientId=${selectedUser.id}`
          : `${API_URL}/api/messages`;
        
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          // Decrypt messages on load
          const decryptedData = data.map(msg => ({
            ...msg,
            content: decryptMessage(msg.content, msg.sender, msg.recipient)
          }));
          setMessages(decryptedData);
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
      // Decrypt message on arrival
      const decryptedMsg = {
        ...msg,
        content: decryptMessage(msg.content, msg.sender, msg.recipient)
      };

      const isGlobalMsg = !msg.recipient && !selectedUser;
      const isPrivateMsg = selectedUser && (
        (msg.sender === selectedUser.id && msg.recipient === user.id) ||
        (msg.sender === user.id && msg.recipient === selectedUser.id)
      );

      if (isGlobalMsg || isPrivateMsg) {
        setMessages((prev) => [...prev, decryptedMsg]);
      } else if (msg.sender !== user.id) {
        // Increment unread count for the sender
        setUnreadCounts((prev) => ({
          ...prev,
          [msg.sender || 'global']: (prev[msg.sender || 'global'] || 0) + 1
        }));

        setNotification({
          sender: msg.sender,
          senderName: msg.senderName,
          content: decryptedMsg.content
        });
        setTimeout(() => setNotification(null), 4000);
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

    const encryptedContent = encryptMessage(newMessage, user.id, selectedUser?.id);
    
    // Strict Security Check: If for any reason encryption fails, we do NOT send the message
    if (encryptedContent === newMessage && newMessage.length > 0) {
      console.error("Security Error: Encryption failed. Message blocked.");
      return;
    }

    socket.emit('sendMessage', {
      content: encryptedContent,
      recipientId: selectedUser?.id || null,
    });
    setNewMessage('');
    socket.emit('stopTyping');
  };

  const selectUser = (u) => {
    setSelectedUser(u);
    // Clear unread count when selecting the user/group
    setUnreadCounts((prev) => ({
      ...prev,
      [u?.id || 'global']: 0
    }));
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-dark-bg text-gray-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 w-80 bg-dark-sidebar border-r border-dark-border z-30 transition-transform duration-300 ease-in-out flex flex-col`}>
        {/* User Profile Header */}
        <div className="p-4 bg-dark-header/50 backdrop-blur-md flex items-center justify-between border-b border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/20">
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{user.username}</span>
              <span className="text-[10px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
          <button onClick={logout} className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search conversations..." 
              className="w-full bg-dark-bg border border-dark-border rounded-xl py-2 pl-10 pr-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto chat-scrollbar">
          <div className="px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Contacts</div>

          {filteredUsers.map((u) => {
            const isOnline = onlineUsers.includes(u.id);
            return (
              <div 
                key={u.id} 
                onClick={() => selectUser({ id: u.id, username: u.username })}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-all border-l-4 ${selectedUser?.id === u.id ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-dark-active'}`}
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md" style={{ background: `linear-gradient(135deg, hsl(${u.username.length * 40}, 60%, 50%), hsl(${u.username.length * 40 + 40}, 60%, 40%))` }}>
                    {u.username[0].toUpperCase()}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-dark-sidebar rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold truncate text-white">{u.username}</h4>
                    {unreadCounts[u.id] > 0 && (
                      <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                        {unreadCounts[u.id]}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${isOnline ? 'text-primary' : 'text-secondary-text'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-dark-bg">
        {/* Mobile Header Toggle */}
        <div className="md:hidden p-4 flex items-center gap-3 bg-dark-header border-b border-dark-border">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-dark-active rounded-lg transition-colors">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2 className="font-semibold">{selectedUser ? selectedUser.username : 'Global Community'}</h2>
        </div>

        {(!selectedUser) ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
             <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <svg viewBox="0 0 24 24" className="w-12 h-12 text-primary" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
             </div>
             <h1 className="text-4xl font-bold tracking-tight mb-2">Pulse Advanced</h1>
             <p className="text-secondary-text max-w-sm">Select a contact to start an encrypted private conversation.</p>
             <div className="mt-8 flex gap-4">
                <span className="px-3 py-1 rounded-full bg-dark-border text-[10px] font-bold text-gray-400">SSL ENCRYPTED</span>
                <span className="px-3 py-1 rounded-full bg-dark-border text-[10px] font-bold text-gray-400">REAL-TIME</span>
             </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <header className="hidden md:flex p-4 items-center justify-between bg-dark-header/80 backdrop-blur-xl border-b border-dark-border sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg" style={{ background: `linear-gradient(135deg, hsl(${selectedUser.username.length * 40}, 60%, 50%), hsl(${selectedUser.username.length * 40 + 40}, 60%, 40%))` }}>
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">{selectedUser.username}</h2>
                  <p className="text-xs text-secondary-text">
                    {typingUsers.size > 0 ? (
                      <span className="text-primary italic animate-pulse">
                        {Array.from(typingUsers).join(', ')} typing...
                      </span>
                    ) : (onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline')}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-2 hover:bg-dark-active rounded-xl transition-colors text-gray-400">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                 </button>
                 <button className="p-2 hover:bg-dark-active rounded-xl transition-colors text-gray-400">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                    </svg>
                 </button>
              </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 chat-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg._id} 
                  message={msg} 
                  isOwn={msg.sender === user.id} 
                  onImageClick={(url) => setZoomedImage(url)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-dark-header/80 backdrop-blur-xl border-t border-dark-border">
              <form className="max-w-5xl mx-auto flex items-end gap-3" onSubmit={handleSendMessage}>
                <div className="flex-1 bg-dark-bg border border-dark-border rounded-2xl flex items-end p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                  <ImageUpload onImageReady={(imageUrl) => {
                    socket.emit('sendMessage', { image: imageUrl, recipientId: selectedUser?.id || null });
                  }} />
                  <textarea
                    rows="1"
                    placeholder="Message..."
                    className="flex-1 bg-transparent border-none outline-none text-sm p-2 resize-none max-h-32 chat-scrollbar"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      if (socket) socket.emit(e.target.value ? 'typing' : 'stopTyping');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        handleSendMessage(e);
                      }
                    }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-3 bg-primary hover:bg-primary-hover text-white rounded-2xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale disabled:scale-100 active:scale-95"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M1.101,21.757L23.8,12.028L1.101,2.3L1.1,10.136l13.569,1.892L1.1,13.921L1.101,21.757z" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}

        {/* Notifications */}
        {notification && (
          <div 
            onClick={() => selectUser({ id: notification.sender, username: notification.senderName })}
            className="fixed top-6 right-6 max-w-sm w-full bg-dark-card border border-primary/30 rounded-2xl p-4 shadow-2xl z-50 slide-in cursor-pointer hover:bg-dark-active transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold">
                {notification.senderName[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-bold">New Message</p>
                <h4 className="text-sm font-semibold truncate">{notification.senderName}</h4>
                <p className="text-xs text-secondary-text truncate">{notification.content || 'Sent an image'}</p>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fadeIn"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-zoomIn"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
