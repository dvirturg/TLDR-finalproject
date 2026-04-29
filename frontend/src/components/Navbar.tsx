import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarFallback = user?.username
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
            to="/profile"
            className={({ isActive }) =>
              `navbar-link${isActive ? ' navbar-link--active' : ''}`
            }
          >
            <i className="bi bi-person-fill navbar-icon" />
            Profile
          </NavLink>

          <NavLink
            to="/upload"
            className={({ isActive }) =>
              `navbar-link${isActive ? ' navbar-link--active' : ''}`
            }
          >
            <i className="bi bi-plus-circle-fill navbar-icon" />
            Upload
          </NavLink>

          <NavLink
            to="/search"
            className={({ isActive }) =>
              `navbar-link${isActive ? ' navbar-link--active' : ''}`
            }
          >
            <i className="bi bi-search navbar-icon" />
            Search
          </NavLink>
        </div>

        <div className="navbar-user">
          {user?.username && (
            <span className="navbar-greeting">
              Hello, <strong>{user.username}</strong>
            </span>
          )}
          <div className="navbar-avatar">
            {user?.profileUrl ? (
              <img
                src={user.profileUrl}
                alt={user.username ?? 'User'}
                className="navbar-avatar-img"
              />
            ) : (
              <span className="navbar-avatar-fallback">{avatarFallback}</span>
            )}
          </div>
          <button className="navbar-logout" onClick={handleLogout} title="Logout">
            <i className="bi bi-box-arrow-right" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
