import { FiMenu, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { getUser, logout } from '../../utils/auth';
import { useState } from 'react';

const Header = ({ onMenuClick }) => {
  const user = getUser();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Left section */}
        <div className="header-left">
          <button onClick={onMenuClick} className="menu-button">
            <FiMenu size={24} />
          </button>
          <div className="header-logo">
            <div className="logo-icon">
              <span>TT</span>
            </div>
            <div className="logo-text">
              <h1>Track and Trace Admin</h1>
              <p>Supply Chain Management</p>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="header-right">
          {/* <button className="notification-btn">
            <FiBell size={20} />
            <span className="notification-badge"></span>
          </button> */}

          {/* User menu */}
          <div className="user-menu">
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="user-menu-button">
              <div className="user-avatar">
                <FiUser size={18} />
              </div>
              <div className="user-info">
                <span className="user-name">{user?.name || 'Admin'}</span>
                <span className="user-role">{user?.role || 'Administrator'}</span>
              </div>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <p>{user?.name}</p>
                  <p>{user?.email}</p>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  <FiLogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
