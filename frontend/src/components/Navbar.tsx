import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

interface StoredUser {
  id?: string;
  _id?: string;
  username?: string;
  profileUrl?: string;
}

const Navbar: React.FC = () => {
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
    <nav className="app-navbar">
      <div className="navbar-inner">
        <span className="navbar-brand">TLDR</span>

        <div className="navbar-links">
          <NavLink
            to="/feed"
            className={({ isActive }) =>
              `navbar-link${isActive ? ' navbar-link--active' : ''}`
            }
          >
            <i className="bi bi-house-fill navbar-icon" />
            Home
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              `navbar-link${isActive ? ' navbar-link--active' : ''}`
            }
          >
            <i className="bi bi-chat-dots-fill navbar-icon" />
            Chat
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `navbar-link${isActive ? ' navbar-link--active' : ''}`
            }
          >
            <i className="bi bi-person-fill navbar-icon" />
            Profile
          </NavLink>
        </div>

        <div className="navbar-user">
          {user.username && (
            <span className="navbar-greeting">
              Hello, <strong>{user.username}</strong>
            </span>
          )}
          <div className="navbar-avatar">
            {user.profileUrl ? (
              <img
                src={user.profileUrl}
                alt={user.username ?? 'User'}
                className="navbar-avatar-img"
              />
            ) : (
              <span className="navbar-avatar-fallback">{avatarFallback}</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
