import { useState, useEffect } from 'react';
import { FiSearch, FiUserCheck, FiMail, FiCheckCircle, FiXCircle, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { formatDate, getRoleBadgeColor } from '../utils/formatters';
import { useOwner } from '../context/OwnerContext';

const Owners = () => {
  const { selectedOwner, selectOwner, clearOwner } = useOwner();
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOwners();
  }, []);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      if (response.success) {
        setAllUsers(response.users);
      }
    } catch (error) {
      console.error('Failed to load owners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (userId) => {
    if (window.confirm('Are you sure you want to activate this owner?')) {
      try {
        await adminAPI.activateUser(userId);
        loadOwners();
      } catch (error) {
        alert('Failed to activate owner');
      }
    }
  };

  const handleDeactivate = async (userId) => {
    if (window.confirm('Are you sure you want to deactivate this owner?')) {
      try {
        await adminAPI.deactivateUser(userId);
        loadOwners();
      } catch (error) {
        alert('Failed to deactivate owner');
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
        <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            size="sm"
            variant={selectedOwner?._id === row.original._id ? 'primary' : 'secondary'}
            onClick={() => {
              if (selectedOwner?._id === row.original._id) {
                clearOwner();
              } else {
                selectOwner(row.original);
              }
            }}
            icon={<FiFilter />}
            title={selectedOwner?._id === row.original._id ? 'Clear filter' : 'Filter by this owner'}
          >
            {selectedOwner?._id === row.original._id ? 'Clear' : 'Select'}
          </Button>
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

  const owners = allUsers.filter(user => user.role === 'owner');
  
  const filteredOwners = owners.filter((owner) => {
    const matchesSearch = owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      owner.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'active' && owner.is_active) ||
      (statusFilter === 'inactive' && !owner.is_active);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Owners Management</h1>
          <p>Manage all owner accounts in the system</p>
          {selectedOwner && (
            <div style={{ 
              marginTop: '0.5rem', 
              padding: '0.5rem 1rem', 
              backgroundColor: 'var(--primary-50)', 
              border: '1px solid var(--primary-200)',
              borderRadius: 'var(--radius-md)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <FiFilter style={{ color: 'var(--primary-600)' }} />
              <span style={{ fontSize: '0.875rem', color: 'var(--primary-700)' }}>
                Filtering all pages by: <strong>{selectedOwner.name}</strong> ({selectedOwner.company_name})
              </span>
              <button
                onClick={clearOwner}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-600)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  marginLeft: '0.5rem'
                }}
                title="Clear filter"
              >
                <FiXCircle size={16} />
              </button>
            </div>
          )}
        </div>
        <Button
          onClick={loadOwners}
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
              placeholder="Search owners..."
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
          <Table data={filteredOwners} columns={columns} />
        )}
      </div>
    </div>
  );
};

export default Owners;
