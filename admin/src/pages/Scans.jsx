import { useState, useEffect } from 'react';
import { FiSearch, FiActivity, FiMapPin, FiRefreshCw, FiEye, FiX, FiFilter } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import { formatDate } from '../utils/formatters';
import { useOwner } from '../context/OwnerContext';

const Scans = () => {
  const { selectedOwner } = useOwner();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedScan, setSelectedScan] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadScans();
  }, [currentPage, resultFilter, selectedOwner]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllScans(currentPage, 50, selectedOwner?._id);
      if (response.success) {
        let filteredScans = response.scans;
        if (resultFilter) {
          filteredScans = filteredScans.filter(scan => 
            resultFilter === 'genuine' ? scan.scan_result?.is_genuine : !scan.scan_result?.is_genuine
          );
        }
        setScans(filteredScans);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Failed to load scans:', error);
    } finally {
      setLoading(false);
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
    {
      header: 'Drug Name',
      accessorKey: 'drug_info.drug_name',
      cell: ({ row }) => row.original.drug_info?.drug_name || 'N/A',
    },
    {
      header: 'Batch',
      accessorKey: 'drug_info.batch_number',
      cell: ({ row }) => row.original.drug_info?.batch_number || 'N/A',
    },
    {
      header: 'Manufacturer',
      accessorKey: 'drug_info.manufacturer',
      cell: ({ row }) => row.original.drug_info?.manufacturer || 'N/A',
    },
    {
      header: 'Result',
      accessorKey: 'scan_result.is_genuine',
      cell: ({ row }) => (
        <span className={`badge ${row.original.scan_result?.is_genuine ? 'badge-success' : 'badge-danger'}`}>
          {row.original.scan_result?.is_genuine ? 'GENUINE' : 'FAKE'}
        </span>
      ),
    },
    {
      header: 'User ID',
      accessorKey: 'user_id',
      cell: ({ row }) => (
        <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
          {row.original.user_id || 'Anonymous'}
        </span>
      ),
    },
    {
      header: 'Scanned',
      accessorKey: 'scanned_at',
      cell: ({ row }) => formatDate(row.original.scanned_at),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSelectedScan(row.original);
            setShowQRModal(true);
          }}
          icon={<FiEye />}
        >
          View QR
        </Button>
      ),
    },
  ];

  // Get unique values for filters
  const manufacturers = [...new Set(scans.map(s => s.drug_info?.manufacturer).filter(Boolean))];
  const batches = [...new Set(scans.map(s => s.drug_info?.batch_number).filter(Boolean))];
  const statuses = [...new Set(scans.map(s => s.scan_result?.status).filter(Boolean))];

  const filteredScans = scans.filter((scan) => {
    // Search filter
    const matchesSearch = !searchQuery || (
      scan.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.drug_info?.drug_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.drug_info?.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.drug_info?.batch_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Manufacturer filter
    const matchesManufacturer = !manufacturerFilter || scan.drug_info?.manufacturer === manufacturerFilter;

    // Batch filter
    const matchesBatch = !batchFilter || scan.drug_info?.batch_number === batchFilter;

    // Status filter
    const matchesStatus = !statusFilter || scan.scan_result?.status === statusFilter;

    return matchesSearch && matchesManufacturer && matchesBatch && matchesStatus;
  });

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Scan Logs</h1>
          <p>View all drug verification scans</p>
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
          onClick={loadScans}
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
              placeholder="Search scans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={resultFilter}
            onChange={(e) => {
              setResultFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Results</option>
            <option value="genuine">Genuine</option>
            <option value="fake">Fake</option>
          </select>
          <select
            value={manufacturerFilter}
            onChange={(e) => setManufacturerFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Manufacturers</option>
            {manufacturers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Batches</option>
            {batches.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {statuses.map(s => (
              <option key={s} value={s}>{s.toUpperCase()}</option>
            ))}
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
            <Table data={filteredScans} columns={columns} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setSelectedScan(null);
        }}
        title="Drug QR Code & Details"
        size="lg"
      >
        {selectedScan && (
          <div style={{ padding: '1rem' }}>
            {/* QR Code Display */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {selectedScan.drug_info?.qr_code ? (
                <img
                  src={selectedScan.drug_info.qr_code}
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
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="info-item">
                <span className="info-item-label">Serial Number</span>
                <span className="info-item-value" style={{ fontFamily: 'monospace' }}>
                  {selectedScan.serial_number}
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Drug Name</span>
                <span className="info-item-value">{selectedScan.drug_info?.drug_name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Batch Number</span>
                <span className="info-item-value">{selectedScan.drug_info?.batch_number || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Manufacturer</span>
                <span className="info-item-value">{selectedScan.drug_info?.manufacturer || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Manufacturing Date</span>
                <span className="info-item-value">
                  {selectedScan.drug_info?.manufacturing_date || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Expiry Date</span>
                <span className="info-item-value">
                  {selectedScan.drug_info?.expiry_date || 'N/A'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Description</span>
                <span className="info-item-value">{selectedScan.drug_info?.description || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Scan Result</span>
                <span className={`badge ${selectedScan.scan_result?.is_genuine ? 'badge-success' : 'badge-danger'}`}>
                  {selectedScan.scan_result?.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Message</span>
                <span className="info-item-value">{selectedScan.scan_result?.message || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Scanned By (User ID)</span>
                <span className="info-item-value" style={{ fontFamily: 'monospace' }}>
                  {selectedScan.user_id || 'Anonymous'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-item-label">Scanned At</span>
                <span className="info-item-value">{formatDate(selectedScan.scanned_at)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Scans;
