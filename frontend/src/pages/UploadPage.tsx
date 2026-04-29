import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost } from '../api/postsApi';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('text', text.trim());
      if (imageFile) formData.append('image', imageFile);
      await createPost(formData);
      navigate('/feed');
    } catch {
      setError('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feed-page">
      <h1>Create Post</h1>
      <div className="upload-card">
        <form onSubmit={handleSubmit}>
          <div className="upload-field">
            <label className="upload-label" htmlFor="post-text">
              What's on your mind?
            </label>
            <textarea
              id="post-text"
              className="upload-textarea"
              placeholder="Write something..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              disabled={submitting}
            />
          </div>

          <div className="upload-field">
            <label className="upload-label">Image (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={submitting}
            />
            {!previewUrl ? (
              <button
                type="button"
                className="upload-zone"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <i className="bi bi-image upload-zone-icon" />
                <span>Click to add an image</span>
                <span className="upload-zone-hint">JPEG, PNG, GIF, WebP — max 5 MB</span>
              </button>
            ) : (
              <div className="upload-preview">
                <img src={previewUrl} alt="Preview" className="upload-preview-img" />
                <button
                  type="button"
                  className="upload-remove-btn"
                  onClick={handleRemoveImage}
                  disabled={submitting}
                  title="Remove image"
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              </div>
            )}
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="profile-save-btn upload-submit-btn"
            disabled={submitting || !text.trim()}
          >
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadPage;
