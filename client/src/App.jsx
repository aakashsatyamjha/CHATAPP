import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Chat from './components/Chat.jsx';
import ForgotPassword from './components/ForgotPassword.jsx';

export default function App() {
  const { user } = useAuth();

  return (
    <>
      <div className="glow-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/" />} 
        />
        <Route 
          path="/forgot-password" 
          element={<ForgotPassword />} 
        />
        <Route 
          path="/" 
          element={user ? <Chat /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
    </>
  );
}
