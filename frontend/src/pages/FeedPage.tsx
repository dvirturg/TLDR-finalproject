import React, { useState, useEffect } from 'react';
import { getPosts } from '../api/postsApi';
import { PostInter } from '../types';
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
        setPosts(data.data);
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
        <h1>Feed Page</h1>
        <div className="skeleton-loader"></div>
        <div className="skeleton-loader"></div>
        <div className="skeleton-loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-page">
        <h1>Feed Page</h1>
        <p className="error-message">{error}</p>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <h1>Feed Page</h1>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

export default FeedPage;

