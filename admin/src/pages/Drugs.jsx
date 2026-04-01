import { useState, useEffect } from 'react';
import { FiSearch, FiPackage, FiEye, FiRefreshCw, FiFilter } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { formatDate } from '../utils/formatters';
import { useOwner } from '../context/OwnerContext';

const Drugs = () => {
  const { selectedOwner } = useOwner();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadDrugs();
  }, [currentPage, selectedOwner]);

  const loadDrugs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllDrugs(currentPage, 50, selectedOwner?._id);
      if (response.success) {
        setDrugs(response.drugs);
      }
    } catch (error) {
      console.error('Failed to load drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (drug) => {
    setSelectedDrug(drug);
    setShowDetailsModal(true);
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
    {
      header: 'Drug Name',
      accessorKey: 'drug_name',
    },
    {
      header: 'Manufacturer',
      accessorKey: 'manufacturer',
    },
    // {
    //   header: 'Current Owner',
    //   accessorKey: 'current_owner_name',
    //   cell: ({ row }) => row.original.current_owner_name || 'N/A',
    // },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const statusColors = {
          manufactured: 'badge-info',
          in_transit: 'badge-warning',
          delivered: 'badge-success',
          sold: 'badge-primary',
        };
        return (
          <span className={`badge ${statusColors[row.original.status] || 'badge-secondary'}`}>
            {row.original.status?.replace('_', ' ').toUpperCase()}
          </span>
        );
      },
    },
    {
      header: 'Manufactured',
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
        </div>
      ),
    },
  ];

  const filteredDrugs = drugs.filter((drug) =>
    drug.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.drug_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Drugs Management</h1>
          <p>View and manage all drugs in the supply chain</p>
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
          onClick={loadDrugs}
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
              placeholder="Search by serial number, drug name, or manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-container">
            <Loader size="lg" />
          </div>
        ) : (
          <>
            <Table data={filteredDrugs} columns={columns} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Drug Details Modal with QR Code */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Drug QR Code & Details"
        size="lg"
      >
        {selectedDrug && (
          <div style={{ padding: '1rem' }}>
            {/* QR Code Display */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {selectedDrug.qr_code ? (
                <img
                  src={selectedDrug.qr_code}
                  alt="Drug QR Code"
                  style={{
                    maxWidth: '300px',
                    width: '100%',
                    border: '2px solid var(--gray-300)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    backgroundColor: 'white'
                  }}
                />
              ) : (
                <p style={{ color: 'var(--gray-500)' }}>No QR code available</p>
              )}
            </div>

            {/* Drug Details */}
            <div className="info-list">
              <div className="info-item">
                <span className="info-item-label">Serial Number</span>
                <span className="info-item-value" style={{ fontFamily: 'monospace' }}>
                  {selectedDrug.serial_number}
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Drug Name</span>
                <span className="info-item-value">{selectedDrug.drug_name}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Batch Number</span>
                <span className="info-item-value">{selectedDrug.batch_number}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Manufacturer</span>
                <span className="info-item-value">{selectedDrug.manufacturer}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Status</span>
                <span className="info-item-value">
                  <span className={`badge ${selectedDrug.status === 'active' ? 'badge-success' : 'badge-secondary'}`}>
                    {selectedDrug.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Manufacturing Date</span>
                <span className="info-item-value">{selectedDrug.manufacturing_date || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Expiry Date</span>
                <span className="info-item-value">{selectedDrug.expiry_date || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Description</span>
                <span className="info-item-value">{selectedDrug.description || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Created At</span>
                <span className="info-item-value">{formatDate(selectedDrug.created_at)}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Updated At</span>
                <span className="info-item-value">{formatDate(selectedDrug.updated_at)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Drugs;
