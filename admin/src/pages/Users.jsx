import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEdit, FiTrash2, FiCheckCircle, FiXCircle, FiPlus } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { formatDate, formatRole, getRoleBadgeColor } from '../utils/formatters';

const Users = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateOwnerModal, setShowCreateOwnerModal] = useState(false);
  const [creatingOwner, setCreatingOwner] = useState(false);
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    email: '',
    password: '',
    company_name: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      if (response.success) {
        setAllUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    if (window.confirm('Are you sure you want to activate this user?')) {
      try {
        await adminAPI.activateUser(userId);
        loadUsers();
      } catch (error) {
        alert('Failed to activate user');
      }
    }
  };

  const handleDeactivate = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      try {
        await adminAPI.deactivateUser(userId);
        loadUsers();
      } catch (error) {
        alert('Failed to deactivate user');
      }
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminAPI.deleteUser(userId);
        loadUsers();
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const handleCreateOwner = async (e) => {
    e.preventDefault();
    setCreatingOwner(true);
    try {
      const response = await adminAPI.createOwner(ownerForm);
      if (response.success) {
        alert('Owner created successfully');
        setShowCreateOwnerModal(false);
        setOwnerForm({ name: '', email: '', password: '', company_name: '' });
        loadUsers();
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create owner');
    } finally {
      setCreatingOwner(false);
    }
  };

  const columns = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="user-info">
          <p>{row.original.name}</p>
          <p>{row.original.email}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ row }) => (
        <span className={`badge ${getRoleBadgeColor(row.original.role)}`}>
          {formatRole(row.original.role)}
        </span>
      ),
    },
    {
      header: 'Company',
      accessorKey: 'company_name',
      cell: ({ row }) => row.original.company_name || 'N/A',
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: ({ row }) => (
        <span className={`badge ${row.original.is_active ? 'badge-success' : 'badge-danger'}`}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="action-buttons">
          {row.original.is_active ? (
            <button
              onClick={() => handleDeactivate(row.original._id)}
              className="action-btn danger"
              title="Deactivate"
            >
              <FiXCircle size={18} />
            </button>
          ) : (
            <button
              onClick={() => handleActivate(row.original._id)}
              className="action-btn success"
              title="Activate"
            >
              <FiCheckCircle size={18} />
            </button>
          )}
          <button
            onClick={() => handleDelete(row.original._id)}
            className="action-btn danger"
            title="Delete"
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Users Management</h1>
          <p>Manage all users in the system</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button
            onClick={loadUsers}
            variant="secondary"
            icon={<FiSearch />}
          >
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateOwnerModal(true)}
            icon={<FiPlus />}
          >
            Create Owner
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="filter-grid">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Roles</option>
            <option value="owner">Owner</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="distributor">Distributor</option>
            <option value="retailer">Retailer</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-container">
            <Loader size="lg" />
          </div>
        ) : (
          <Table data={filteredUsers} columns={columns} />
        )}
      </div>

      {/* Create Owner Modal */}
      <Modal
        isOpen={showCreateOwnerModal}
        onClose={() => setShowCreateOwnerModal(false)}
        title="Create New Owner"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreateOwnerModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOwner} loading={creatingOwner}>
              Create Owner
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateOwner}>
          <Input
            label="Name"
            name="name"
            value={ownerForm.name}
            onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            value={ownerForm.email}
            onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            name="password"
            value={ownerForm.password}
            onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
            required
          />
          <Input
            label="Company Name"
            name="company_name"
            value={ownerForm.company_name}
            onChange={(e) => setOwnerForm({ ...ownerForm, company_name: e.target.value })}
            required
          />
        </form>
      </Modal>
    </div>
  );
};

export default Users;
