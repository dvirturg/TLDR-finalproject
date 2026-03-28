import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserById, getUserPosts } from '../api/usersApi';
import PostCard from '../components/PostCard';
import type { PostInter, UserProfileData } from '../types';

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [posts, setPosts] = useState<PostInter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [profile, userPosts] = await Promise.all([
          getUserById(user.id),
          getUserPosts(user.id),
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
  }, [user]);

  const handleEditOpen = () => {
    setEditUsername(profileData?.username ?? '');
    setEditFile(null);
    setPreviewUrl(null);
    setSaveError(null);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditFile(null);
    setPreviewUrl(null);
    setSaveError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setEditFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const formData = new FormData();
      formData.append('username', editUsername);
      if (editFile) formData.append('profilePicture', editFile);
      await updateProfile(formData);
      const updated = await getUserById(user.id);
      setProfileData(updated);
      setIsEditing(false);
      setEditFile(null);
      setPreviewUrl(null);
    } catch {
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = previewUrl ?? profileData?.profileUrl ?? null;
  const avatarFallback = (profileData?.username ?? user?.username ?? '?').charAt(0).toUpperCase();

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
        <div
          className="profile-page-avatar profile-avatar-clickable"
          onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
          title={isEditing ? 'Click to change photo' : undefined}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={profileData?.username ?? 'User'} className="profile-page-avatar-img" />
          ) : (
            <span className="profile-page-avatar-fallback">{avatarFallback}</span>
          )}
          {isEditing && (
            <div className="profile-avatar-edit-overlay">
              <span>Change</span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {!isEditing ? (
          <div className="profile-info">
            <h2 className="profile-username">{profileData?.username}</h2>
            {user?.email && <p className="profile-email">{user.email}</p>}
            <button className="profile-edit-btn" onClick={handleEditOpen}>
              Edit profile
            </button>
          </div>
        ) : (
          <div className="profile-edit-form">
            <label className="profile-edit-label">
              Username
              <input
                className="profile-edit-input"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                disabled={saving}
              />
            </label>
            {saveError && <p className="error-message">{saveError}</p>}
            <div className="profile-edit-actions">
              <button className="profile-save-btn" onClick={handleSave} disabled={saving || !editUsername.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="profile-cancel-btn" onClick={handleEditCancel} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="profile-posts-section">
        <h3 className="profile-posts-heading">Posts</h3>
        {posts.length === 0 ? (
          <p className="profile-no-posts">No posts yet.</p>
        ) : (
          posts.map((post) => <PostCard key={post._id ?? post.id} post={post} />)
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
