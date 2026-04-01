import { useState, useEffect } from 'react';
import { FiSearch, FiMail, FiTrash2, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { formatDate, formatRole, getRoleBadgeColor } from '../utils/formatters';

const Invitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadInvitations();
  }, [currentPage, statusFilter]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllInvitations(currentPage, 50, statusFilter || null);
      if (response.success) {
        setInvitations(response.invitations);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invitationId) => {
    if (window.confirm('Are you sure you want to delete this invitation?')) {
      try {
        await adminAPI.deleteInvitation(invitationId);
        loadInvitations();
      } catch (error) {
        alert('Failed to delete invitation');
      }
    }
  };

  const columns = [
    {
      header: 'Email',
      accessorKey: 'email',
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
      header: 'Invited By',
      accessorKey: 'invited_by_name',
      cell: ({ row }) => row.original.invited_by_name || 'Admin',
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <span className={`badge ${row.original.status === 'accepted' ? 'badge-success' : 'badge-warning'}`}>
          {row.original.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Sent',
      accessorKey: 'created_at',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="action-buttons">
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

  const filteredInvitations = invitations.filter((invitation) =>
    invitation.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Invitations Management</h1>
          <p>View and manage all invitations</p>
        </div>
        <Button
          onClick={loadInvitations}
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
              placeholder="Search invitations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-container">
            <Loader size="lg" />
          </div>
        ) : (
          <>
            <Table data={filteredInvitations} columns={columns} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Invitations;
