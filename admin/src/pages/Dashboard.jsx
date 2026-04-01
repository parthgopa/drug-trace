import { useState, useEffect } from 'react';
import { FiUsers, FiPackage, FiActivity, FiAlertCircle, FiMail, FiTrendingUp } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import StatCard from '../components/StatCard';
import Loader from '../components/Loader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await adminAPI.getStats();
      if (response.success) {
        setStats(response.stats);
      }
      console.log(response);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size="lg" />
      </div>
    );
  }

  const userRoleData = stats?.users ? [
    { name: 'Owners', value: stats.users.owners },
    { name: 'Manufacturers', value: stats.users.manufacturers },
    { name: 'Distributors', value: stats.users.distributors },
    { name: 'Retailers', value: stats.users.retailers },
    { name: 'Customers', value: stats.users.customers },
  ] : [];

  const invitationData = stats?.invitations ? [
    { name: 'Pending', value: stats.invitations.pending },
    { name: 'Accepted', value: stats.invitations.accepted },
  ] : [];

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="page-section">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h1>Dashboard</h1>
          <p>Welcome to Drug Track & Trace Admin Panel</p>
        </div>
        <div className="dashboard-status">
          <FiTrendingUp />
          <span>System Status: Active</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats?.users?.total || 0}
          icon={<FiUsers size={24} />}
          color="blue"
        />
        <StatCard
          title="Total Drugs"
          value={stats?.drugs?.total || 0}
          icon={<FiPackage size={24} />}
          color="green"
        />
        <StatCard
          title="Total Scans"
          value={stats?.scans?.total || 0}
          icon={<FiActivity size={24} />}
          color="purple"
        />
        <StatCard
          title="Pending Reports"
          value={stats?.reports?.pending || 0}
          icon={<FiAlertCircle size={24} />}
          color="red"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">User Breakdown</h3>
            <FiUsers className="info-card-icon" size={20} />
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="info-item-label">Owners</span>
              <span className="info-item-value">{stats?.users?.owners || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Manufacturers</span>
              <span className="info-item-value">{stats?.users?.manufacturers || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Distributors</span>
              <span className="info-item-value">{stats?.users?.distributors || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Retailers</span>
              <span className="info-item-value">{stats?.users?.retailers || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Customers</span>
              <span className="info-item-value">{stats?.users?.customers || 0}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">Invitations</h3>
            <FiMail className="info-card-icon" size={20} />
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="info-item-label">Total</span>
              <span className="info-item-value">{stats?.invitations?.total || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Pending</span>
              <span className="info-item-value" style={{color: 'var(--warning)'}}>{stats?.invitations?.pending || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Accepted</span>
              <span className="info-item-value" style={{color: 'var(--success)'}}>{stats?.invitations?.accepted || 0}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">Reports</h3>
            <FiAlertCircle className="info-card-icon" size={20} />
          </div>
          <div className="info-list">
            <div className="info-item">
              <span className="info-item-label">Total</span>
              <span className="info-item-value">{stats?.reports?.total || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Pending</span>
              <span className="info-item-value" style={{color: 'var(--error)'}}>{stats?.reports?.pending || 0}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Resolved</span>
              <span className="info-item-value" style={{color: 'var(--success)'}}>{stats?.reports?.resolved || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* User Distribution Chart */}
        <div className="card">
          <div className="card-header">
            <h3>User Distribution by Role</h3>
          </div>
          <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {userRoleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Invitation Status</h3>
          </div>
          <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={invitationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div className="card-body">
        <div className="quick-actions">
          <a href="/users" className="quick-action-card">
            <FiUsers className="quick-action-icon" size={24} />
            <div className="quick-action-text">
              <p>Manage Users</p>
              <p>View all users</p>
            </div>
          </a>
          <a href="/drugs" className="quick-action-card">
            <FiPackage className="quick-action-icon" size={24} />
            <div className="quick-action-text">
              <p>Manage Drugs</p>
              <p>View all drugs</p>
            </div>
          </a>
          <a href="/reports" className="quick-action-card">
            <FiAlertCircle className="quick-action-icon" size={24} />
            <div className="quick-action-text">
              <p>View Reports</p>
              <p>{stats?.reports?.pending || 0} pending</p>
            </div>
          </a>
          <a href="/invitations" className="quick-action-card">
            <FiMail className="quick-action-icon" size={24} />
            <div className="quick-action-text">
              <p>Invitations</p>
              <p>{stats?.invitations?.pending || 0} pending</p>
            </div>
          </a>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
