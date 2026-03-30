import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostInter } from '../types';
import { likePost, updatePost, deletePost } from '../api/postsApi';
import axiosInstance from '../api/axiosInstance';

interface PostCardProps {
  post: PostInter;
  isOwner?: boolean;
  onDelete?: (id: string) => void;
  onPostUpdated?: (post: PostInter) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, isOwner, onDelete, onPostUpdated }) => {
  const navigate = useNavigate();
  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return null; }
  }, []);

  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId || null;
  const canLike = !!currentUserId;

  const likesArray = Array.isArray(post.likes) ? post.likes : null;
  const isLikedByMe = !!currentUserId && !!likesArray && likesArray.includes(currentUserId);
  const likesCountValue = likesArray ? likesArray.length : post.likes;

  const [isLiked, setIsLiked] = useState<boolean>(isLikedByMe || false);
  const [likesCount, setLikesCount] = useState<number>(typeof likesCountValue === 'number' ? likesCountValue : 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const commentsCount = typeof post.commentCount === 'number' ? post.commentCount : 0;

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleLike = async () => {
    if (!canLike || isLoading) return;
    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;
    try {
      setIsLoading(true);
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(newIsLiked ? likesCount + 1 : likesCount - 1);
      if (post._id && currentUserId) {
        await likePost(post._id, currentUserId);
      }
    } catch (err) {
      console.error('Failed to like post:', err);
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorClick = () => {
    const authorId =
      (post.author as PostInter['author'] & { _id?: string; userId?: string })?._id ||
      post.author?.id ||
      (post.author as PostInter['author'] & { _id?: string; userId?: string })?.userId;
    if (!authorId) return;
    if (authorId === currentUserId) {
      navigate('/profile');
    } else {
      navigate(`/profile/${authorId}`);
    }
  };

  const handleOpenComments = () => {
    const postId = post._id || post.id;
    if (!postId) return;
    navigate(`/post/${postId}/comments`);
  };

  const handleEditOpen = () => {
    setEditText(post.text);
    setEditImageFile(null);
    setEditImagePreview(post.imageUrl || null);
    setEditError(null);
    setShowMenu(false);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditImageFile(null);
    setEditImagePreview(null);
    setEditError(null);
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setEditImageFile(file);
    setEditImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleEditRemoveImage = () => {
    setEditImageFile(null);
    setEditImagePreview(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  const handleEditSave = async () => {
    const postId = post._id || post.id;
    if (!postId || !editText.trim()) return;
    setIsSaving(true);
    setEditError(null);

    const imageChanged = editImageFile !== null || (editImagePreview === null && !!post.imageUrl);

    try {
      let updated: PostInter;
      if (imageChanged) {
        const formData = new FormData();
        formData.append('text', editText.trim());
        if (editImageFile) formData.append('image', editImageFile);
        const res = await axiosInstance.put<PostInter>(`/post/${postId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updated = res.data;
      } else {
        updated = await updatePost(postId, { text: editText.trim() });
      }
      onPostUpdated?.(updated);
      setIsEditing(false);
      setEditImageFile(null);
      setEditImagePreview(null);
    } catch (err) {
      console.error('Failed to update post:', err);
      setEditError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const postId = post._id || post.id;
    if (!postId) return;
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    setIsDeleting(true);
    setShowMenu(false);
    try {
      await deletePost(postId);
      onDelete?.(postId);
    } catch (err) {
      console.error('Failed to delete post:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className={`post-card${isDeleting ? ' post-card--deleting' : ''}`}>
      <div className="post-header">
        {post.author && (
          <>
            <img
              src={post.author.profileUrl}
              alt={post.author.username}
              className="profile-pic"
              onClick={handleAuthorClick}
              style={{ cursor: 'pointer' }}
            />
            <span
              className="username"
              onClick={handleAuthorClick}
              style={{ cursor: 'pointer' }}
            >
              {post.author.username}
            </span>
          </>
        )}
        {!post.author && <span className="username">Unknown Author</span>}
        {isOwner && (
          <div className="post-header-actions" ref={menuRef}>
            <button
              className="post-menu-btn"
              onClick={() => setShowMenu(v => !v)}
              aria-label="Post options"
            >
              ⋯
            </button>
            {showMenu && (
              <div className="post-menu-dropdown">
                <button className="post-menu-item" onClick={handleEditOpen}>
                  ✏️ Edit
                </button>
                <button className="post-menu-item post-menu-item--delete" onClick={handleDelete}>
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="post-edit-area">
          <div className="upload-field">
            <label className="upload-label">What's on your mind?</label>
            <textarea
              className="upload-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              disabled={isSaving}
            />
          </div>

          <div className="upload-field">
            <label className="upload-label">Image (optional)</label>
            <input
              ref={editFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={{ display: 'none' }}
              onChange={handleEditFileChange}
              disabled={isSaving}
            />
            {!editImagePreview ? (
              <button
                type="button"
                className="upload-zone"
                onClick={() => editFileInputRef.current?.click()}
                disabled={isSaving}
              >
                <i className="bi bi-image upload-zone-icon" />
                <span>Click to add an image</span>
                <span className="upload-zone-hint">JPEG, PNG, GIF, WebP — max 5 MB</span>
              </button>
            ) : (
              <div className="upload-preview">
                <img src={editImagePreview} alt="Preview" className="upload-preview-img" />
                <button
                  type="button"
                  className="upload-remove-btn"
                  onClick={handleEditRemoveImage}
                  disabled={isSaving}
                  title="Remove image"
                >
                  <i className="bi bi-x-circle-fill" />
                </button>
              </div>
            )}
          </div>

          {editError && <p className="error-message">{editError}</p>}

          <div className="profile-edit-actions">
            <button
              className="profile-save-btn"
              onClick={handleEditSave}
              disabled={isSaving || !editText.trim()}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              className="profile-cancel-btn"
              onClick={handleEditCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="post-content">
          <p>{post.text}</p>
          {post.imageUrl && post.imageUrl.trim() !== '' && (
            <img src={post.imageUrl} alt="Post image" className="post-image" />
          )}
        </div>
      )}

      <div className="post-actions">
        <button
          className={`like-button ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!canLike || isLoading}
          title={!canLike ? 'Log in to like posts' : undefined}
        >
          <span className="icon">{isLiked ? '❤️' : '🤍'}</span>
          <span>{likesCount}</span>
        </button>
        <button className="comment-button" type="button" onClick={handleOpenComments}>
          <span className="icon">💬</span>
          <span>{commentsCount}</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
