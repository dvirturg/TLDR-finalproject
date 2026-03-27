import React, { useState, useEffect } from 'react';
import { getPosts } from '../api/postsApi';
import { getCommentsByPost } from '../api/commentsApi';
import type { PostInter } from '../types';
import PostCard from '../components/PostCard';

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<PostInter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPosts();
        const postsArray = Array.isArray(data) ? data : data.data || [];

        const postsWithCounts = await Promise.all(
          postsArray.map(async (post) => {
            const postId = post._id || post.id;
            if (!postId) {
              return { ...post, commentCount: 0 };
            }
            try {
              const comments = await getCommentsByPost(postId);
              return { ...post, commentCount: comments.length };
            } catch {
              return { ...post, commentCount: 0 };
            }
          }),
        );

        setPosts(postsWithCounts);
      } catch (err) {
        setError('Failed to fetch posts. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleRetry = () => {
    // Implement retry logic here if needed
    window.location.reload(); // Simple retry for now
  };

  if (loading) {
    return (
      <div className="feed-page">
        <div className="skeleton-loader"></div>
        <div className="skeleton-loader"></div>
        <div className="skeleton-loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-page">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  return (
    <div className="feed-page">
      {posts.map((post, index) => (
        <PostCard key={post._id ?? post.id ?? index} post={post} />
      ))}
    </div>
  );
};

export default FeedPage;

