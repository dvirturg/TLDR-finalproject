import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserById, getUserPosts } from '../api/usersApi';
import PostCard from '../components/PostCard';
import type { PostInter, UserProfileData } from '../types';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [posts, setPosts] = useState<PostInter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const currentUserId =
      (currentUser as { id?: string; _id?: string; userId?: string } | null)?.id ||
      (currentUser as { id?: string; _id?: string; userId?: string } | null)?._id ||
      (currentUser as { id?: string; _id?: string; userId?: string } | null)?.userId;
    if (currentUserId && userId === currentUserId) {
      navigate('/profile', { replace: true });
      return;
    }
    const load = async () => {
      try {
        const [profile, userPosts] = await Promise.all([
          getUserById(userId),
          getUserPosts(userId),
        ]);
        setProfileData(profile);
        setPosts(userPosts);
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, currentUser, navigate]);

  const avatarFallback = (profileData?.username ?? '?').charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="profile-page">
        <div className="skeleton-loader" style={{ height: 120, borderRadius: 12 }} />
        <div className="skeleton-loader" style={{ height: 300 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-page-avatar">
          {profileData?.profileUrl ? (
            <img
              src={profileData.profileUrl}
              alt={profileData.username}
              className="profile-page-avatar-img"
            />
          ) : (
            <span className="profile-page-avatar-fallback">{avatarFallback}</span>
          )}
        </div>

        <div className="profile-info">
          <h2 className="profile-username">{profileData?.username}</h2>
          <button
            className="profile-edit-btn"
            onClick={() => navigate('/chat')}
          >
            Chat
          </button>
        </div>
      </div>

      <div className="profile-posts-section">
        <h3 className="profile-posts-heading">Posts</h3>
        {posts.length === 0 ? (
          <p className="profile-no-posts">No posts yet.</p>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id ?? post.id}
              post={post}
              isOwner={false}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;
