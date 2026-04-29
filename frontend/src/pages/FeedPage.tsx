import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { getPosts } from '../api/postsApi';
import type { PostInter } from '../types';
import PostCard from '../components/PostCard';
import RecommendationsSidebar from '../components/RecommendationsSidebar';

const FeedPage: React.FC = () => {
  const [posts, setPosts] = useState<PostInter[]>([]);
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
      const response = await getPosts({ page: pageNumber });
      const nextPosts = response.data ?? [];
      setPosts((prevPosts) => (pageNumber === 1 ? nextPosts : [...prevPosts, ...nextPosts]));
      setHasNextPage(response.pagination?.hasNextPage ?? false);
      setPage(pageNumber);
    } catch (err) {
      if (pageNumber === 1) {
        setError('Failed to fetch posts. Please try again.');
      } else {
        setLoadMoreError('Failed to load more posts. Try again.');
      }
      console.error(err);
    } finally {
      if (pageNumber === 1) {
        setIsInitialLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, []);

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
    setPosts([]);
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
      <div className="feed-page-container">
        <div className="feed-page">
          <div className="skeleton-loader"></div>
          <div className="skeleton-loader"></div>
          <div className="skeleton-loader"></div>
        </div>
        <RecommendationsSidebar userId={userId} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-page-container">
        <div className="feed-page">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleRetry}>Retry</button>
        </div>
        <RecommendationsSidebar userId={userId} />
      </div>
    );
  }

  return (
    <div className="feed-page-container">
      <div className="feed-page">
        {posts.map((post, index) => (
          <PostCard key={post._id ?? post.id ?? index} post={post} />
        ))}
        {loadMoreError && (
          <div className="feed-load-more-error">
            <p className="error-message">{loadMoreError}</p>
            <button className="retry-button" onClick={handleLoadMoreRetry}>Retry</button>
          </div>
        )}
        {isLoadingMore && <div className="feed-loading-more">Loading more posts...</div>}
        {hasNextPage && !isLoadingMore && <div ref={loadMoreRef} style={{ height: '1px' }} />}
      </div>
      <RecommendationsSidebar userId={userId} />
    </div>
  );
};

export default FeedPage;

