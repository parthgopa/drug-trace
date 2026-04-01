import { useState, useEffect } from 'react';
import { FiSearch, FiUsers, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { formatDate } from '../utils/formatters';

const Customers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      if (response.success) {
        setAllUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    if (window.confirm('Are you sure you want to activate this customer?')) {
      try {
        await adminAPI.activateUser(userId);
        loadCustomers();
      } catch (error) {
        alert('Failed to activate customer');
      }
    }
  };

  const handleDeactivate = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this customer?')) {
      try {
        await adminAPI.deactivateUser(userId);
        loadCustomers();
      } catch (error) {
        alert('Failed to deactivate customer');
      }
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
      header: 'Status',
      accessorKey: 'is_active',
      cell: ({ row }) => (
        <span className={`badge ${row.original.is_active ? 'badge-success' : 'badge-danger'}`}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Joined',
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
        </div>
      ),
    },
  ];

  const customers = allUsers.filter(user => user.role === 'customer');
  
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && customer.is_active) ||
      (statusFilter === 'inactive' && !customer.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Customers Management</h1>
          <p>Manage all customer accounts in the system</p>
        </div>
        <Button
          onClick={loadCustomers}
          variant="secondary"
          icon={<FiRefreshCw />}
        >
          Refresh
        </Button>
      </div>

      <div className="filter-bar">
        <div className="filter-grid">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-container">
            <Loader size="lg" />
          </div>
        ) : (
          <Table data={filteredCustomers} columns={columns} />
        )}
      </div>
    </div>
  );
};

export default Customers;
