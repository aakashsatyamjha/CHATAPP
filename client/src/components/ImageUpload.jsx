import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { API_URL } from '../utils/api.js';

export default function ImageUpload({ onImageReady }) {
  const { token } = useAuth();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      onImageReady(data.imageUrl);
      setPreview(null);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const cancelPreview = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex items-center">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all disabled:opacity-50"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Send an image"
      >
        {uploading ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </button>

      {/* Preview Overlay */}
      {preview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-dark-card border border-dark-border rounded-3xl p-6 shadow-2xl slide-in">
            <h3 className="text-lg font-bold mb-4">Preview Image</h3>
            <div className="rounded-2xl overflow-hidden mb-6 border border-dark-border shadow-inner">
              <img src={preview} alt="preview" className="w-full max-h-[60vh] object-contain bg-dark-bg" />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={cancelPreview} 
                className="px-6 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-dark-active transition-all"
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-95"
                disabled={uploading}
              >
                {uploading ? 'Sending...' : 'Send Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
