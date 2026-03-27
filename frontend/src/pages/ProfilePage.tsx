import React, { useState, useEffect } from 'react';

interface StoredUser {
  id?: string;
  _id?: string;
  username?: string;
  profileUrl?: string;
}

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<StoredUser>({});

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser({});
      }
    }
  }, []);

  const avatarFallback = user.username
    ? user.username.charAt(0).toUpperCase()
    : '?';

  return (
    <div className="placeholder-page">
      <div className="profile-page-avatar">
        {user.profileUrl ? (
          <img
            src={user.profileUrl}
            alt={user.username ?? 'User'}
            className="profile-page-avatar-img"
          />
        ) : (
          <span className="profile-page-avatar-fallback">{avatarFallback}</span>
        )}
      </div>
      {user.username && <h2>{user.username}</h2>}
      <p>Profile features coming soon.</p>
    </div>
  );
};

export default ProfilePage;
