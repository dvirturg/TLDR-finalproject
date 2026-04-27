import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getRecommendedPosts } from '../api/postsApi';
import type { PostInter } from '../types';
import PostCard from '../components/PostCard';

const RecommendationsPage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<PostInter[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); }
    catch { return null; }
  }, []);
  const userId = currentUser?.id || currentUser?._id || currentUser?.userId || null;

  const loadPage = useCallback(async (pageNumber: number) => {
    if (pageNumber === 1) {
      setIsInitialLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
      setLoadMoreError(null);
    }

    try {
      if (!userId) return;
      const data = await getRecommendedPosts(userId, { page: pageNumber });
      const nextPosts = data.data ?? [];
      setRecommendations((prevPosts) => (pageNumber === 1 ? nextPosts : [...prevPosts, ...nextPosts]));
      setHasNextPage(data.pages ? pageNumber < data.pages : false);
      setPage(pageNumber);
    } catch (err) {
      if (pageNumber === 1) {
        setError('Failed to load recommendations. Please try again.');
      } else {
        setLoadMoreError('Failed to load more recommendations. Try again.');
      }
      console.error(err);
    } finally {
      if (pageNumber === 1) {
        setIsInitialLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  useEffect(() => {
    if (!loadMoreRef.current || isInitialLoading || isLoadingMore || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadPage(page + 1);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isInitialLoading, isLoadingMore, loadPage, page]);

  const handleRetry = () => {
    setRecommendations([]);
    setPage(1);
    setHasNextPage(true);
    setLoadMoreError(null);
    void loadPage(1);
  };

  const handleLoadMoreRetry = () => {
    void loadPage(page + 1);
  };

  if (isInitialLoading) {
    return (
      <div className="feed-page">
        <h2>Recommended For You</h2>
        <div className="skeleton-loader"></div>
        <div className="skeleton-loader"></div>
        <div className="skeleton-loader"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-page">
        <h2>Recommended For You</h2>
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="feed-page">
        <h2>Recommended For You</h2>
        <p className="recommendations-empty">No recommendations available yet</p>
      </div>
    );
  }

  return (
    <div className="feed-page">
      <h2>Recommended For You</h2>
      {recommendations.map((post, index) => (
        <PostCard key={post._id ?? post.id ?? index} post={post} />
      ))}
      {loadMoreError && (
        <div className="feed-load-more-error">
          <p className="error-message">{loadMoreError}</p>
          <button className="retry-button" onClick={handleLoadMoreRetry}>Retry</button>
        </div>
      )}
      {isLoadingMore && <div className="feed-loading-more">Loading more recommendations...</div>}
      {hasNextPage && !isLoadingMore && <div ref={loadMoreRef} style={{ height: '1px' }} />}
    </div>
  );
};

export default RecommendationsPage;
