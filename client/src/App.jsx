import React from 'react';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Chat from './components/Chat.jsx';

export default function App() {
  const { user } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-bg">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        <div className="auth-container">
          <div className="auth-header">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h1>Pulse Chat</h1>
            </div>
            <p className="auth-subtitle">Connect instantly. Chat beautifully.</p>
          </div>
          <div className="auth-tabs">
            <button
              className={`auth-tab ${!showRegister ? 'active' : ''}`}
              onClick={() => setShowRegister(false)}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${showRegister ? 'active' : ''}`}
              onClick={() => setShowRegister(true)}
            >
              Sign Up
            </button>
          </div>
          {showRegister ? (
            <Register onSwitch={() => setShowRegister(false)} />
          ) : (
            <Login onSwitch={() => setShowRegister(true)} />
          )}
        </div>
      </div>
    );
  }

  return <Chat />;
}
