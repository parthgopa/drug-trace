import { useState, useEffect } from 'react';
import { FiSearch, FiActivity, FiMapPin, FiRefreshCw } from 'react-icons/fi';
import { adminAPI } from '../services/api';
import Table from '../components/Table';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { formatDate } from '../utils/formatters';

const Scans = () => {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  useEffect(() => {
    loadScans();
  }, [currentPage, resultFilter]);

  const loadScans = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllScans(currentPage, 50);
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
  ];

  const filteredScans = scans.filter((scan) =>
    scan.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.drug_info?.drug_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.drug_info?.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    scan.user_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-section">
      <div className="page-header">
        <div className="page-title">
          <h1>Scan Logs</h1>
          <p>View all drug verification scans</p>
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
    </div>
  );
};

export default Scans;
