import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CommentSection from '../components/CommentSection';
import { getPostById } from '../api/postsApi';
import type { PostInter } from '../types';

const PostCommentsPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostInter | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('Missing post id');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const fetchedPost = await getPostById(postId);
        setPost(fetchedPost);
      } catch (err) {
        setError('Failed to load post.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="feed-page">
        <div className="skeleton-loader"></div>
      </div>
    );
  }

  if (error || !post || !postId) {
    return (
      <div className="feed-page">
        <p className="error-message">{error || 'Post not found.'}</p>
        <Link to="/feed" className="btn btn-outline-secondary">
          Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <div className="post-card post-summary-card">
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
      </div>

      <div className="mb-3">
        <Link to="/feed" className="btn btn-outline-secondary btn-sm">
          Back to Feed
        </Link>
      </div>

      <CommentSection postId={postId} />
    </div>
  );
};

export default PostCommentsPage;

