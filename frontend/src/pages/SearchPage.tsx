import React, { useState } from 'react';
import { searchPosts } from '../api/postsApi';
import PostCard from '../components/PostCard';
import type { PostInter } from '../types';

const SearchPage: React.FC = () => {


  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [postResults, setPostResults] = useState<PostInter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const handleSearch = async (e?: React.FormEvent, pageNum?: number) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const currentPage = pageNum || 1;
    try {
      const postsRes = await searchPosts(query, { page: currentPage });
      setPostResults(postsRes.posts || []);
      setPages(postsRes.pagination?.totalPages || 1);
      setPage(currentPage);
    } catch (err) {
      setError('Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <form className="search-header" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search posts..."
          className="search-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          disabled={loading}
        />
        <button className="search-button" type="submit" disabled={loading || !query.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>
      <div className="search-results">
        {error && <div className="error-message">{error}</div>}
        {postResults.length > 0 && (
          <div className="search-posts-section">
            <h3>Posts</h3>
            <div className="search-posts-list">
              {postResults.map(post => (
                <PostCard key={post._id || post.id} post={post} />
              ))}
            </div>
            {pages > 1 && (
              <div className="search-pagination">
                <button
                  className="search-page-btn"
                  onClick={() => handleSearch(undefined, page - 1)}
                  disabled={page === 1 || loading}
                >
                  Previous
                </button>
                <span className="search-page-info">Page {page} of {pages}</span>
                <button
                  className="search-page-btn"
                  onClick={() => handleSearch(undefined, page + 1)}
                  disabled={page === pages || loading}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
        {!loading && !error && postResults.length === 0 && (
          <div className="search-empty">No results found.</div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
