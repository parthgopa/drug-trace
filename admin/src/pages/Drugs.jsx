import { useState, useEffect } from 'react';
import { FiSearch, FiPackage, FiEye, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Button from '../components/Button';
import { formatDate } from '../utils/formatters';

const Drugs = () => {
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadDrugs();
  }, [currentPage]);

  const loadDrugs = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllDrugs(currentPage, 50);
      if (response.success) {
        // console.log(response);
        setDrugs(response.drugs);
        // setTotalPages(response.pagination.pages);
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

      {/* Drug Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Drug Details"
        size="lg"
      >
        {selectedDrug && (
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
              {/* <div className="info-item">
                <span className="info-item-label">Current Owner</span>
                <span className="info-item-value">{selectedDrug.current_owner_name || 'N/A'}</span>
              </div> */}
            <div className="info-item">
              <span className="info-item-label">Status</span>
              <span className="info-item-value">{selectedDrug.status}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Manufacture Date</span>
              <span className="info-item-value">{formatDate(selectedDrug.created_at)}</span>
            </div>
            <div className="info-item">
              <span className="info-item-label">Expiry Date</span>
              <span className="info-item-value">{formatDate(selectedDrug.expiry_date)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Drugs;
