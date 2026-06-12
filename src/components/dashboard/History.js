import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, OutlinedInput, Checkbox,
  ListItemText, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Tooltip, Chip,
  CircularProgress, Alert, Divider,
} from '@mui/material';
import { apiService } from '../../services/api';
import { formatDateTimeForDashboard } from '../../utils/dateUtils';
import HaltDetailModal from './components/HaltDetailModal';
import './History.css';

const STATUS_OPTIONS = [
  { value: 'ACTIVE_REG_HALT', label: 'Active Reg Halt' },
  { value: 'ACTIVE_SSCB_HALT', label: 'Active SSCB Halt' },
  { value: 'PENDING_HALT', label: 'Pending Halt' },
  { value: 'ACTIVE_TRADING', label: 'Lifted' },
];

const MARKET_OPTIONS = ['CDX', 'NASDAQ', 'NYSE', 'TSX', 'TSE'];

const HISTORY_COLUMNS = [
  { key: 'symbol', label: 'Symbol' },
  { key: 'haltId', label: 'Halt Event ID' },
  { key: 'issueName', label: 'Issue Name' },
  { key: 'listingMarket', label: 'Listing Mkt' },
  { key: 'state', label: 'Status' },
  { key: 'haltType', label: 'Halt Type' },
  { key: 'haltTime', label: 'Halt Time', isDate: true },
  { key: 'resumptionTime', label: 'Resumption Time', isDate: true },
  { key: 'createdBy', label: 'Created By' },
];

const parseHaltDate = (dateStr) => {
  if (!dateStr) return null;
  const compactMatch = String(dateStr).match(/^(\d{8})-(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (compactMatch) {
    const [, d, h, m, s, ms] = compactMatch;
    return new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${h}:${m}:${s}.${ms}`);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const EMPTY_FILTERS = { fromDate: '', toDate: '', status: [], symbol: '', market: [] };

const History = () => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderBy, setOrderBy] = useState('haltTime');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [selectedHalt, setSelectedHalt] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [haltReasons, setHaltReasons] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, reasons] = await Promise.all([
        apiService.fetchHaltHistory(),
        apiService.fetchHaltReasons(),
      ]);
      setAllData(data);
      setFilteredData(data);
      setHaltReasons(reasons);
    } catch (err) {
      setError(err.message || 'Failed to load history data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = useCallback(() => {
    let result = [...allData];

    if (filters.fromDate) {
      const from = new Date(filters.fromDate + 'T00:00:00');
      result = result.filter(h => {
        const d = parseHaltDate(h.haltTime);
        return d && d >= from;
      });
    }

    if (filters.toDate) {
      const to = new Date(filters.toDate + 'T23:59:59');
      result = result.filter(h => {
        const d = parseHaltDate(h.haltTime);
        return d && d <= to;
      });
    }

    if (filters.status.length > 0) {
      result = result.filter(h => filters.status.includes(h.state));
    }

    if (filters.symbol.trim()) {
      const sym = filters.symbol.trim().toUpperCase();
      result = result.filter(h => h.symbol?.toUpperCase().includes(sym));
    }

    if (filters.market.length > 0) {
      result = result.filter(h => filters.market.includes(h.listingMarket));
    }

    setFilteredData(result);
  }, [allData, filters]);

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setFilteredData(allData);
  };

  const handleSort = (key) => {
    const isAsc = orderBy === key && orderDirection === 'asc';
    setOrderBy(key);
    setOrderDirection(isAsc ? 'desc' : 'asc');
  };

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[orderBy] ?? '';
    let bVal = b[orderBy] ?? '';

    if (orderBy === 'haltTime' || orderBy === 'resumptionTime') {
      aVal = parseHaltDate(aVal) ?? new Date(0);
      bVal = parseHaltDate(bVal) ?? new Date(0);
    }

    if (aVal < bVal) return orderDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return orderDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleHaltIdClick = (halt) => {
    setSelectedHalt(halt);
    setDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setDetailModalOpen(false);
    setSelectedHalt(null);
  };

  const renderCell = (row, col) => {
    if (col.key === 'haltId') {
      return (
        <TableCell key={col.key} sx={{ padding: '2px 6px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          <Tooltip title={`Click for detail: ${row.haltId}`} arrow>
            <Box
              component="span"
              onClick={() => handleHaltIdClick(row)}
              sx={{
                color: '#1976d2',
                fontWeight: 550,
                cursor: 'pointer',
                padding: '2px 0',
                borderBottom: '1px solid transparent',
                transition: 'all 0.15s ease',
                '&:hover': { color: '#1565c0', borderBottomColor: '#1565c0' },
              }}
            >
              {row.haltId}
            </Box>
          </Tooltip>
        </TableCell>
      );
    }

    if (col.isDate) {
      return (
        <TableCell key={col.key} sx={{ padding: '2px 6px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
          {row[col.key] ? formatDateTimeForDashboard(row[col.key]) : ''}
        </TableCell>
      );
    }

    return (
      <TableCell
        key={col.key}
        sx={{
          padding: '2px 6px',
          fontSize: '0.75rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: col.key === 'issueName' ? '160px' : '120px',
        }}
      >
        {row[col.key] || ''}
      </TableCell>
    );
  };

  const hasActiveFilters = filters.fromDate || filters.toDate || filters.symbol ||
    filters.status.length > 0 || filters.market.length > 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh" gap={2}>
        <CircularProgress sx={{ color: '#006666' }} size={28} />
        <Typography color="#004644">Loading history data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert
          severity="error"
          action={<Button color="inherit" size="small" onClick={loadData}>Retry</Button>}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box className="history-container">
      {/* Filter panel */}
      <Paper className="history-filter-panel" elevation={2}>
        <Typography className="history-filter-title">Search Halt History</Typography>
        <Box className="history-filters">
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={filters.fromDate}
            onChange={e => handleFilterChange('fromDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 148 }}
          />
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={filters.toDate}
            onChange={e => handleFilterChange('toDate', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 148 }}
          />
          <FormControl size="small" sx={{ minWidth: 155 }}>
            <InputLabel>Status</InputLabel>
            <Select
              multiple
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
              input={<OutlinedInput label="Status" />}
              renderValue={selected =>
                selected.length === 0
                  ? ''
                  : selected.length === 1
                    ? STATUS_OPTIONS.find(o => o.value === selected[0])?.label
                    : `${selected.length} selected`
              }
            >
              {STATUS_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value} dense>
                  <Checkbox checked={filters.status.includes(opt.value)} size="small" sx={{ p: '2px 6px 2px 0' }} />
                  <ListItemText primary={opt.label} primaryTypographyProps={{ fontSize: '0.82rem' }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Symbol"
            size="small"
            value={filters.symbol}
            onChange={e => handleFilterChange('symbol', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="e.g. AAPL"
            inputProps={{ style: { textTransform: 'uppercase' } }}
            sx={{ minWidth: 110 }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Market</InputLabel>
            <Select
              multiple
              value={filters.market}
              onChange={e => handleFilterChange('market', e.target.value)}
              input={<OutlinedInput label="Market" />}
              renderValue={selected =>
                selected.length === 0 ? '' : selected.join(', ')
              }
            >
              {MARKET_OPTIONS.map(m => (
                <MenuItem key={m} value={m} dense>
                  <Checkbox checked={filters.market.includes(m)} size="small" sx={{ p: '2px 6px 2px 0' }} />
                  <ListItemText primary={m} primaryTypographyProps={{ fontSize: '0.82rem' }} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={applyFilters}
              className="history-search-button"
            >
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={resetFilters}
              className="history-reset-button"
            >
              Reset
            </Button>
          </Box>
        </Box>

        <Box className="history-active-chips">
          {hasActiveFilters ? (
            <>
              {filters.fromDate && (
                <Chip
                  size="small"
                  label={`From: ${filters.fromDate}`}
                  onDelete={() => handleFilterChange('fromDate', '')}
                />
              )}
              {filters.toDate && (
                <Chip
                  size="small"
                  label={`To: ${filters.toDate}`}
                  onDelete={() => handleFilterChange('toDate', '')}
                />
              )}
              {filters.symbol && (
                <Chip
                  size="small"
                  label={`Symbol: ${filters.symbol.toUpperCase()}`}
                  onDelete={() => handleFilterChange('symbol', '')}
                />
              )}
              {filters.status.map(s => (
                <Chip
                  key={s}
                  size="small"
                  label={STATUS_OPTIONS.find(o => o.value === s)?.label || s}
                  onDelete={() => handleFilterChange('status', filters.status.filter(x => x !== s))}
                />
              ))}
              {filters.market.map(m => (
                <Chip
                  key={m}
                  size="small"
                  label={`Market: ${m}`}
                  onDelete={() => handleFilterChange('market', filters.market.filter(x => x !== m))}
                />
              ))}
            </>
          ) : (
            <Typography className="history-no-filters">No filters applied</Typography>
          )}
        </Box>
      </Paper>

      <Divider className="history-divider" />

      {/* Results table */}
      <Box className="history-results">
        <Typography className="history-count">
          {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
        </Typography>

        <TableContainer component={Paper} className="history-table-container">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {HISTORY_COLUMNS.map(col => (
                  <TableCell key={col.key} className="history-table-header">
                    <TableSortLabel
                      active={orderBy === col.key}
                      direction={orderBy === col.key ? orderDirection : 'asc'}
                      onClick={() => handleSort(col.key)}
                      sx={{
                        color: 'white',
                        '&.Mui-active': { color: 'white' },
                        '& .MuiTableSortLabel-icon': { color: 'white !important' },
                      }}
                    >
                      {col.label}
                    </TableSortLabel>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={HISTORY_COLUMNS.length}
                    align="center"
                    sx={{ py: 5, color: '#555', backgroundColor: 'white' }}
                  >
                    No records match the selected filters
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, idx) => (
                  <TableRow
                    key={`${row.haltId}-${idx}`}
                    sx={{
                      backgroundColor: 'white',
                      height: '36px',
                      '&:hover': { backgroundColor: '#f0f8f8' },
                    }}
                  >
                    {HISTORY_COLUMNS.map(col => renderCell(row, col))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <HaltDetailModal
        open={detailModalOpen}
        onClose={closeDetailModal}
        haltData={selectedHalt}
        haltReasons={haltReasons}
        remainReasons={[]}
        onHaltUpdated={loadData}
      />
    </Box>
  );
};

export default History;
