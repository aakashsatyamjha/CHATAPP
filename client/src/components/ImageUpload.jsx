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
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden-file-input"
        id="image-upload-input"
      />
      <button
        type="button"
        className="icon-btn image-upload-btn"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        title="Send an image"
        id="image-upload-btn"
      >
        {uploading ? (
          <span className="btn-loader small"></span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        )}
      </button>
      {preview && (
        <div className="image-preview-overlay" onClick={cancelPreview}>
          <div className="image-preview-card" onClick={(e) => e.stopPropagation()}>
            <img src={preview} alt="preview" />
            <div className="image-preview-actions">
              <span className="preview-label">
                {uploading ? 'Uploading...' : 'Sending image...'}
              </span>
              <button onClick={cancelPreview} className="preview-cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
