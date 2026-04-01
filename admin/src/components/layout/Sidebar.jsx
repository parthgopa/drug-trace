import { NavLink } from 'react-router-dom';
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiPackage,
  FiAlertCircle,
  FiMail,
  FiActivity,
  FiX,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { path: '/dashboard', icon: FiHome, label: 'Dashboard' },
    { path: '/users', icon: FiUsers, label: 'Users Management' },
    { path: '/owners', icon: FiUserCheck, label: 'Owners' },
    { path: '/customers', icon: FiUsers, label: 'Customers' },
    // { path: '/drugs', icon: FiPackage, label: 'Drugs' },
    // { path: '/reports', icon: FiAlertCircle, label: 'Reports' },
    // { path: '/invitations', icon: FiMail, label: 'Invitations' },
    // { path: '/scans', icon: FiActivity, label: 'Scan Logs' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="sidebar-overlay active" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        {/* Close button for mobile */}
        <div className="sidebar-close">
          <button onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <p>Track & Trace</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
