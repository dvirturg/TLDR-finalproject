import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostInter } from '../types';
import { likePost, updatePost, deletePost } from '../api/postsApi';

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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleOpenComments = () => {
    const postId = post._id || post.id;
    if (!postId) return;
    navigate(`/post/${postId}/comments`);
  };

  const handleEditOpen = () => {
    setEditText(post.text);
    setShowMenu(false);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditText(post.text);
  };

  const handleEditSave = async () => {
    const postId = post._id || post.id;
    if (!postId || !editText.trim()) return;
    setIsSaving(true);
    try {
      const updated = await updatePost(postId, { text: editText.trim() });
      onPostUpdated?.(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update post:', err);
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
            <img src={post.author.profileUrl} alt={post.author.username} className="profile-pic" />
            <span className="username">{post.author.username}</span>
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
          <textarea
            className="post-edit-textarea"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            disabled={isSaving}
          />
          <div className="post-edit-actions">
            <button
              className="post-edit-save-btn"
              onClick={handleEditSave}
              disabled={isSaving || !editText.trim()}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              className="post-edit-cancel-btn"
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
