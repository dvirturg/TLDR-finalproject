import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostInter } from '../types';
import { getRecommendedPosts } from '../api/postsApi';
import PostCard from './PostCard';

interface RecommendationsSidebarProps {
  userId: string | null;
}

const RecommendationsSidebar: React.FC<RecommendationsSidebarProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<PostInter[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [llmUnavailable, setLlmUnavailable] = useState<boolean>(false);

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    setLlmUnavailable(false);
    try {
      const data = await getRecommendedPosts(userId);
      setRecommendations(data.data || []);
      
      // Show notification if using fallback (LLM unavailable)
      if (data.usingFallback) {
        setLlmUnavailable(true);
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => setLlmUnavailable(false), 5000);
        return () => clearTimeout(timer);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchRecommendations();
  }, [fetchRecommendations]);

  if (!userId) {
    return null;
  }

  const displayedRecommendations = recommendations.slice(0, 4);
  const hasMore = recommendations.length > 4;

  return (
    <aside className="recommendations-sidebar">
      <div className="recommendations-header">
        <h3>Recommended For You</h3>
        <button
          className="refresh-button"
          onClick={() => void fetchRecommendations()}
          disabled={isLoading}
        >
          🔄
        </button>
      </div>

      {llmUnavailable && (
        <div className="llm-unavailable-popup">
          <div className="popup-content">
            <span className="popup-icon">⚠️</span>
            <p>AI recommendation system temporarily unavailable. Showing popular posts.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="recommendations-error">
          <p>{error}</p>
          <button className="retry-button" onClick={() => void fetchRecommendations()}>
            Retry
          </button>
        </div>
      )}

      {isLoading && (
        <div className="recommendations-loading">
          <div className="skeleton-loader"></div>
          <div className="skeleton-loader"></div>
        </div>
      )}

      {!isLoading && recommendations.length === 0 && !error && (
        <p className="recommendations-empty">No recommendations yet</p>
      )}

      <div className="recommendations-list">
        {displayedRecommendations.map((post) => (
          <div key={post._id || post.id} className="recommendation-item">
            <PostCard post={post} />
          </div>
        ))}
      </div>

      {hasMore && !isLoading && !error && (
        <button
          className="find-more-button"
          onClick={() => navigate('/recommendations')}
        >
          Find More
        </button>
      )}
    </aside>
  );
};

export default RecommendationsSidebar;
