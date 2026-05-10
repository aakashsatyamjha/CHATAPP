import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../utils/api.js';

export default function ImageUpload({ onImageReady }) {
  const { token } = useAuth();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Show local preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      onImageReady(data.imageUrl);
      resetAll();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetAll = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex items-center">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        type="button"
        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all disabled:opacity-50"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Send an image"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </button>

      {/* Preview Overlay */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-dark-card border border-dark-border rounded-[2rem] p-6 shadow-2xl slide-in flex flex-col gap-4 overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-white">Share Image?</h3>
              <button onClick={resetAll} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-dark-border bg-dark-bg flex-1 min-h-0 flex items-center justify-center">
              <img src={preview} alt="preview" className="max-w-full max-h-[40vh] object-contain" />
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button 
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? 'Sending...' : 'Send to Chat'}
              </button>
              <button 
                type="button"
                onClick={resetAll} 
                className="w-full py-2 text-gray-500 hover:text-white transition-all text-sm font-semibold"
                disabled={uploading}
              >
                Not now, cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
