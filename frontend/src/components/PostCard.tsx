import React, { useMemo, useState } from 'react';
import type { PostInter } from '../types';
import { likePost } from '../api/postsApi';
import CommentSection from './CommentSection';

interface PostCardProps {
  post: PostInter;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const currentUser = useMemo(() => {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}, []); // only runs once
  const currentUserId = currentUser?.id || currentUser?._id || currentUser?.userId || null;
  const canLike = !!currentUserId;
  
  const likesArray = Array.isArray(post.likes) ? post.likes : null;
  const isLikedByMe = !!currentUserId && !!likesArray && likesArray.includes(currentUserId);
  const likesCountValue = likesArray ? likesArray.length : post.likes;
  
  const [isLiked, setIsLiked] = useState<boolean>(isLikedByMe || false);
  const [likesCount, setLikesCount] = useState<number>(typeof likesCountValue === 'number' ? likesCountValue : 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);

  const handleLike = async () => {
    if (!canLike || isLoading) return;
    // Store original state for rollback
    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;

    try {
      setIsLoading(true);

      // Optimistic update
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(newIsLiked ? likesCount + 1 : likesCount - 1);

      // Make API call
      if (post._id && currentUserId) {
        await likePost(post._id, currentUserId); // ← add currentUserId
      }
    } catch (err) {
      // Rollback on error
      console.error('Failed to like post:', err);
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="post-card">
      <div className="post-header">
        {post.author && (
          <>
            <img src={post.author.profileUrl} alt={post.author.username} className="profile-pic" />
            <span className="username">{post.author.username}</span>
          </>
        )}
        {!post.author && <span className="username">Unknown Author</span>}
      </div>
      <div className="post-content">
        <p>{post.text}</p>
        {post.imageUrl && post.imageUrl.trim() !== '' && (
          <img src={post.imageUrl} alt="Post image" className="post-image" />
        )}
      </div>
      <div className="post-actions">
        <button 
          className={`like-button ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!canLike || isLoading}
          title={!canLike ? 'Log in to like posts' : undefined}
        >
          <span className="icon">{isLiked ? '❤️' : '🤍'}</span>
        </button>
        <button
          className="comment-button"
          type="button"
          onClick={() => setShowComments((prev) => !prev)}
        >
          <span className="icon">💬</span>
        </button>
      </div>
      {showComments && post._id && <CommentSection postId={post._id} />}
    </div>
  );
};

export default PostCard;
