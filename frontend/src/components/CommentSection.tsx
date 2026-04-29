import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommentInter } from '../types';
import { createComment, getCommentsByPost } from '../api/commentsApi';

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<CommentInter[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');

  const currentUser = useMemo(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }, []);

  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId || '';
  const currentUsername = currentUser?.username || 'You';
  const currentUserProfileUrl = currentUser?.profileUrl || '';

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedComments = await getCommentsByPost(postId);
      setComments(fetchedComments);
    } catch (err) {
      setError('Failed to load comments. Please try again.');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const handleAddComment = async () => {
    const trimmedText = newCommentText.trim();
    if (!trimmedText || !currentUserId || isSubmitting) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticComment: CommentInter = {
      _id: tempId,
      id: tempId,
      text: trimmedText,
      author: { username: currentUsername, profileUrl: currentUserProfileUrl },
      createdAt: new Date().toISOString(),
    };

    setError(null);
    setIsSubmitting(true);
    setComments((prevComments) => [optimisticComment, ...prevComments]);
    setNewCommentText('');

    try {
      const createdComment = await createComment({
        text: trimmedText,
        postId,
        author: currentUserId,
      });
      setComments((prevComments) =>
        prevComments.map((comment) =>
          (comment._id || comment.id) === tempId ? createdComment : comment,
        ),
      );
    } catch (err) {
      setError('Failed to add comment. Please try again.');
      setComments((prevComments) =>
        prevComments.filter((comment) => (comment._id || comment.id) !== tempId),
      );
      console.error('Error adding comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  if (loading) {
    return <div className="mt-3 text-muted small">Loading comments...</div>;
  }

  return (
    <div className="mt-3 card comment-section">
      <div className="card-body p-3">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h3 className="h6 mb-0">Comments ({comments.length})</h3>
        </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
          <span className="me-3">{error}</span>
          <button type="button" onClick={fetchComments} className="btn btn-sm btn-outline-danger">
            Retry
          </button>
        </div>
      )}
        <div className="list-group list-group-flush mb-3">
          {comments.length === 0 && (
            <div className="list-group-item text-muted">
              No comments yet. Be the first to comment.
            </div>
          )}
          {comments.map((comment) => (
            <div key={comment._id || comment.id} className="list-group-item">
              <div className="d-flex align-items-start justify-content-between mb-1">
                <div className="fw-semibold small">
                  {comment.author?.username || 'Unknown user'}
                </div>
                <div className="text-muted small ms-3">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
              <div>{comment.text}</div>
            </div>
          ))}
        </div>

        <div className="input-group">
          <input
            type="text"
            className="form-control"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddComment();
              }
            }}
            placeholder={currentUserId ? 'Add a comment...' : 'Log in to write a comment'}
            disabled={!currentUserId || isSubmitting}
          />
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!newCommentText.trim() || !currentUserId || isSubmitting}
            className="btn btn-primary"
            aria-label="Send comment"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="18"
              height="18"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        {!currentUserId && (
          <div className="text-muted small mt-2">Log in to write a comment.</div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;
