import React, { useMemo, useState } from 'react';
import type { PostInter } from '../types';
import { likePost } from '../api/postsApi';

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
  
  const likes = post.likes as any;
  const isArray = Array.isArray(likes);
  const isLikedByMe = currentUserId && isArray && likes.some((u: any) => u === currentUserId || u.toString?.() === currentUserId);
  const likesCountValue = isArray ? likes.length : likes;
  
  const [isLiked, setIsLiked] = useState<boolean>(isLikedByMe || false);
  const [likesCount, setLikesCount] = useState<number>(typeof likesCountValue === 'number' ? likesCountValue : 0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLike = async () => {
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
        {post.imageUrl && <img src={post.imageUrl} alt="Post image" className="post-image" />}
      </div>
      <div className="post-actions">
        <button 
          className={`like-button ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLoading}
        >
          <span className="icon">{isLiked ? '❤️' : '🤍'}</span>
        </button>
        <button className="comment-button">
          <span className="icon">💬</span>
        </button>
      </div>
    </div>
  );
};

export default PostCard;
