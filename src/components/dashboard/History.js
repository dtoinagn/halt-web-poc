import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, OutlinedInput, Checkbox,
  ListItemText, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TableSortLabel, Tooltip,
  CircularProgress, Alert, Divider, RadioGroup, FormControlLabel,
  Radio,
} from '@mui/material';
import { apiService } from '../../services/api';
import { formatDateTimeForDashboard } from '../../utils/dateUtils';
import { HALT_TYPES } from '../../constants';
import HaltDetailModal from './components/HaltDetailModal';
import './History.css';

const STATUS_OPTIONS = [
  { value: 'ACTIVE_REG_HALT', label: 'Active Reg Halt' },
  { value: 'ACTIVE_SSCB_HALT', label: 'Active SSCB Halt' },
  { value: 'PENDING_HALT', label: 'Pending Halt' },
  { value: 'ACTIVE_TRADING', label: 'Lifted' },
];

const MARKET_OPTIONS = ['CDX', 'NASDAQ', 'NYSE', 'TSX', 'TSE'];

const AUTO_CLOSE_DELAY_MS = 1500;

const HALT_TYPE_OPTIONS = Object.values(HALT_TYPES);

const EMPTY_COLUMN_FILTERS = {
  symbol: '',
  haltId: '',
  issueName: '',
  listingMarket: [],
  state: [],
  haltType: [],
  createdBy: '',
};

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

const EMPTY_FILTERS = {
  fromDate: '',
  toDate: '',
  status: [],
  symbol: '',
  market: []
};

const History = () => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [columnFilters, setColumnFilters] = useState(EMPTY_COLUMN_FILTERS);
  const [dateFilterType, setDateFilterType] = useState('halt');
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderBy, setOrderBy] = useState('haltTime');
  const [orderDirection, setOrderDirection] = useState('desc');
  const [selectedHalt, setSelectedHalt] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [openMenuField, setOpenMenuField] = useState(null);
  const autoCloseTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(autoCloseTimerRef.current), []);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        dateFilterType: dateFilterType,
        from: filters.fromDate || '',
        to: filters.toDate || '',
      };

      const data = await apiService.searchHaltHistory(payload);
      setAllData(data);
      setFilteredData(data);
    } catch (err) {
      setError(err.message || 'Failed to search history data');
    } finally {
      setLoading(false);
    }
  }, [dateFilterType, filters.fromDate, filters.toDate]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = useCallback(() => {
    if (filters.fromDate || filters.toDate) {
      handleSearch();
      return;
    }

    let result = [...allData];

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
  }, [allData, filters, handleSearch]);

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setColumnFilters(EMPTY_COLUMN_FILTERS);
    setDateFilterType('halt');
    setFilteredData(allData);
  };

  const handleColumnFilterChange = (field, value) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearAutoCloseTimer = () => {
    clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = null;
  };

  const scheduleAutoClose = (field) => {
    clearAutoCloseTimer();
    autoCloseTimerRef.current = setTimeout(() => {
      setOpenMenuField(current => (current === field ? null : current));
    }, AUTO_CLOSE_DELAY_MS);
  };

  const handleMultiSelectChange = (field, value) => {
    handleColumnFilterChange(field, value);
    scheduleAutoClose(field);
  };

  const handleSort = (key) => {
    const isAsc = orderBy === key && orderDirection === 'asc';
    setOrderBy(key);
    setOrderDirection(isAsc ? 'desc' : 'asc');
  };

  const columnFilteredData = useMemo(() => {
    let result = filteredData;

    if (columnFilters.symbol.trim()) {
      const q = columnFilters.symbol.trim().toUpperCase();
      result = result.filter(h => h.symbol?.toUpperCase().includes(q));
    }

    if (columnFilters.haltId.trim()) {
      const q = columnFilters.haltId.trim().toLowerCase();
      result = result.filter(h => h.haltId?.toLowerCase().includes(q));
    }

    if (columnFilters.issueName.trim()) {
      const q = columnFilters.issueName.trim().toLowerCase();
      result = result.filter(h => h.issueName?.toLowerCase().includes(q));
    }

    if (columnFilters.listingMarket.length > 0) {
      result = result.filter(h => columnFilters.listingMarket.includes(h.listingMarket));
    }

    if (columnFilters.state.length > 0) {
      result = result.filter(h => columnFilters.state.includes(h.state));
    }

    if (columnFilters.haltType.length > 0) {
      result = result.filter(h => columnFilters.haltType.includes(h.haltType));
    }

    if (columnFilters.createdBy.trim()) {
      const q = columnFilters.createdBy.trim().toLowerCase();
      result = result.filter(h => h.createdBy?.toLowerCase().includes(q));
    }

    return result;
  }, [filteredData, columnFilters]);

  const sortedData = [...columnFilteredData].sort((a, b) => {
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

  const csvEscape = (value) => {
    const str = String(value ?? '');
    return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const buildCsv = (rows) => {
    const header = HISTORY_COLUMNS.map(col => csvEscape(col.label)).join(',');
    const lines = rows.map(row => HISTORY_COLUMNS.map(col => {
      const raw = col.isDate
        ? (row[col.key] ? formatDateTimeForDashboard(row[col.key]) : '')
        : (row[col.key] ?? '');
      return csvEscape(raw);
    }).join(','));
    return [header, ...lines].join('\r\n');
  };

  const handleExportCsv = async () => {
    if (sortedData.length === 0) return;

    const csvContent = buildCsv(sortedData);
    const filename = `halt-history-${new Date().toISOString().slice(0, 10)}.csv`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'CSV file', accept: { 'text/csv': ['.csv'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(csvContent);
        await writable.close();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('File picker save failed, falling back to default download', err);
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const renderColumnFilter = (col) => {
    const inputSx = {
      width: '100%',
      backgroundColor: 'white',
      borderRadius: 0.5,
      '& .MuiInputBase-input': { fontSize: '0.7rem', padding: '3px 6px' },
      '& .MuiSelect-select': { fontSize: '0.7rem', padding: '3px 20px 3px 6px' },
    };

    if (col.key === 'symbol' || col.key === 'haltId' || col.key === 'issueName' || col.key === 'createdBy') {
      return (
        <TextField
          variant="outlined"
          size="small"
          placeholder="Filter..."
          value={columnFilters[col.key]}
          onChange={e => handleColumnFilterChange(col.key, e.target.value)}
          sx={inputSx}
        />
      );
    }

    if (col.key === 'listingMarket') {
      return (
        <Select
          variant="outlined"
          size="small"
          multiple
          displayEmpty
          open={openMenuField === 'listingMarket'}
          onOpen={() => { setOpenMenuField('listingMarket'); scheduleAutoClose('listingMarket'); }}
          onClose={() => { setOpenMenuField(null); clearAutoCloseTimer(); }}
          value={columnFilters.listingMarket}
          onChange={e => handleMultiSelectChange('listingMarket', e.target.value)}
          renderValue={selected => (selected.length === 0 ? 'All' : '...')}
          sx={inputSx}
        >
          {MARKET_OPTIONS.map(mkt => (
            <MenuItem key={mkt} value={mkt} dense>
              <Checkbox size="small" checked={columnFilters.listingMarket.includes(mkt)} />
              <ListItemText primary={mkt} />
            </MenuItem>
          ))}
        </Select>
      );
    }

    if (col.key === 'state') {
      return (
        <Select
          variant="outlined"
          size="small"
          multiple
          displayEmpty
          open={openMenuField === 'state'}
          onOpen={() => { setOpenMenuField('state'); scheduleAutoClose('state'); }}
          onClose={() => { setOpenMenuField(null); clearAutoCloseTimer(); }}
          value={columnFilters.state}
          onChange={e => handleMultiSelectChange('state', e.target.value)}
          renderValue={selected => (selected.length === 0 ? 'All' : '...')}
          sx={inputSx}
        >
          {STATUS_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value} dense>
              <Checkbox size="small" checked={columnFilters.state.includes(opt.value)} />
              <ListItemText primary={opt.label} />
            </MenuItem>
          ))}
        </Select>
      );
    }

    if (col.key === 'haltType') {
      return (
        <Select
          variant="outlined"
          size="small"
          multiple
          displayEmpty
          open={openMenuField === 'haltType'}
          onOpen={() => { setOpenMenuField('haltType'); scheduleAutoClose('haltType'); }}
          onClose={() => { setOpenMenuField(null); clearAutoCloseTimer(); }}
          value={columnFilters.haltType}
          onChange={e => handleMultiSelectChange('haltType', e.target.value)}
          renderValue={selected => (selected.length === 0 ? 'All' : '...')}
          sx={inputSx}
        >
          {HALT_TYPE_OPTIONS.map(type => (
            <MenuItem key={type} value={type} dense>
              <Checkbox size="small" checked={columnFilters.haltType.includes(type)} />
              <ListItemText primary={type} />
            </MenuItem>
          ))}
        </Select>
      );
    }

    return null;
  };

  const hasActiveFilters = filters.fromDate || filters.toDate ||
    filters.symbol || filters.status.length > 0 || filters.market.length > 0;

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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="history-container">
      {/* Filter panel */}
      <Paper className="history-filter-panel" elevation={2}>
        <Box className="history-filters">
          <Box
            display="flex"
            flexDirection="column"
            gap={0.75}
            sx={{
              minWidth: 320,
              border: '1px solid #c7d2d2',
              borderRadius: 1,
              padding: '8px 10px',
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#004644' }}>
              Search Historical Halts by date:
            </Typography>
            <RadioGroup
              row
              value={dateFilterType}
              onChange={e => setDateFilterType(e.target.value)}
            >
              <FormControlLabel
                value="halt"
                control={<Radio size="small" />}
                label={<Typography variant="caption" sx={{ fontWeight: 300, color: '#004644' }}>Halt Date</Typography>}
              />
              <FormControlLabel
                value="resumed"
                control={<Radio size="small" />}
                label={<Typography variant="caption" sx={{ fontWeight: 300, color: '#004644' }}>Resumed Date</Typography>}
              />
            </RadioGroup>
            <Box display="flex" gap={1} flexWrap="wrap">
              <TextField
                label="From"
                type="date"
                size="small"
                value={filters.fromDate}
                onChange={e => handleFilterChange('fromDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 148,
                  '& .MuiInputLabel-root': {
                    fontSize: '0.75rem',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                    borderBottom: '1px solid #006666',
                    '& input': {
                      fontSize: '0.75rem',
                    },
                  },
                }}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                value={filters.toDate}
                onChange={e => handleFilterChange('toDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  minWidth: 148,
                  '& .MuiInputLabel-root': {
                    fontSize: '0.75rem',
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      border: 'none',
                    },
                    borderBottom: '1px solid #006666',
                    '& input': {
                      fontSize: '0.75rem',
                    },
                  },
                }}
              />
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={applyFilters}
              className="history-search-button"
              sx={{ fontSize: '0.6rem' }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              onClick={resetFilters}
              className="history-reset-button"
              sx={{ fontSize: '0.6rem' }}
            >
              Reset
            </Button>
          </Box>
        </Box>
      </Paper>

      <Divider className="history-divider" />

      {/* Results table */}
      <Box className="history-results">
        <Box display="flex" gap={2} alignItems="center">
          <Button
            variant="contained"
            onClick={handleExportCsv}
            disabled={sortedData.length === 0}
            className="history-export-button"
          >
            Export to CSV
          </Button>
          <Typography className="history-count">
            {sortedData.length} record{sortedData.length !== 1 ? 's' : ''} found
          </Typography>
        </Box>

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
              <TableRow>
                {HISTORY_COLUMNS.map(col => (
                  <TableCell key={col.key} className="history-filter-header-cell">
                    {renderColumnFilter(col)}
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
        haltReasons={[]}
        remainReasons={[]}
        onHaltUpdated={() => {}}
        forceReadOnly
      />
    </Box>
  );
};

export default History;
