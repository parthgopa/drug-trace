import { useState, useEffect } from 'react';
import { FiSearch, FiAlertTriangle, FiCheckCircle, FiClock, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import { useOwner } from '../context/OwnerContext';

const Reports = () => {
  const { selectedOwner } = useOwner();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadReports();
  }, [currentPage, statusFilter, selectedOwner]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllReports(currentPage, 50, statusFilter || null, selectedOwner?._id);
      if (response.success) {
        setReports(response.reports);
        setTotalPages(response.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailsModal(true);
  };

  const handleResolve = async (reportId) => {
    if (window.confirm('Mark this report as resolved?')) {
      try {
        await adminAPI.resolveReport(reportId);
        loadReports();
        setShowDetailsModal(false);
      } catch (error) {
        alert('Failed to resolve report');
      }
    }
  };

  const columns = [
    {
      header: 'Serial Number',
      accessorKey: 'serial_number',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
          {row.original.serial_number}
        </span>
      ),
    },
    // {
    //   header: 'Reported By',
    //   accessorKey: 'reported_by_name',
    //   cell: ({ row }) => (
    //     <div className="user-info">
    //       <p>{row.original.reported_by_name}</p>
    //       <p>{row.original.reported_by_email}</p>
    //     </div>
    //   ),
    // },
    {
      header: 'Reason',
      accessorKey: 'issue_description',
      cell: ({ row }) => (
        <span style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.original.issue_description}
        </span>
      ),
    },
    {
      header: 'Issue Type',
      accessorKey: 'issue_type',
      cell: ({ row }) => (
        <span className={`badge ${row.original.issue_type === 'resolved' ? 'badge-success' : 'badge-danger'}`}>
          {row.original.issue_type.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <span className={`badge ${row.original.status === 'resolved' ? 'badge-success' : 'badge-danger'}`}>
          {row.original.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Reported',
      accessorKey: 'created_at',
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="action-buttons">
          <button
            onClick={() => handleViewDetails(row.original)}
            className="action-btn info"
            title="View Details"
          >
            <FiEye size={18} />
          </button>
          {row.original.status === 'pending' && (
            <button
              onClick={() => handleResolve(row.original._id)}
              className="action-btn success"
              title="Resolve"
            >
              <FiCheckCircle size={18} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filteredReports = reports.filter((report) =>
    report.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.issue_description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Reports Management</h1>
          <p>View and manage all product reports</p>
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
                Filtered by owner: <strong>{selectedOwner.name}</strong>
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={loadReports}
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
              placeholder="Search reports..."
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
            <option value="resolved">Resolved</option>
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
            <Table data={filteredReports} columns={columns} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Report Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Report Details"
        footer={
          selectedReport?.status === 'pending' && (
            <Button onClick={() => handleResolve(selectedReport._id)} variant="primary">
              Mark as Resolved
            </Button>
          )
        }
      >
        {selectedReport && (
          <div className="info-list">
            <div className="info-item">
              <span className="info-item-label">Serial Number</span>
              <span className="info-item-value" style={{ fontFamily: 'monospace' }}>
                {selectedReport.serial_number}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Reported User Id</span>
              <span className="info-item-value">{selectedReport.user_id}</span>
            </div>
            {/* <div className="info-item">
              <span className="info-item-label">Email</span>
              <span className="info-item-value">{selectedReport.reported_by_email}</span>
            </div> */}
            <div className="info-item">
              <span className="info-item-label">Status</span>
              <span className={`badge ${selectedReport.status === 'resolved' ? 'badge-success' : 'badge-danger'}`}>
                {selectedReport.status.toUpperCase()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Reported On</span>
              <span className="info-item-value">{formatDate(selectedReport.created_at)}</span>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Reason:</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>{selectedReport.issue_description}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reports;
