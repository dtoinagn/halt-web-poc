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

const EMPTY_FILTERS = {
  haltDateFrom: '', haltDateTo: '',
  resumptionDateFrom: '', resumptionDateTo: '',
  haltType: '', createdBy: '',
  symbol: '', market: [],
};

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

    if (filters.haltDateFrom) {
      const from = new Date(filters.haltDateFrom + 'T00:00:00');
      result = result.filter(h => {
        const d = parseHaltDate(h.haltTime);
        return d && d >= from;
      });
    }

    if (filters.haltDateTo) {
      const to = new Date(filters.haltDateTo + 'T23:59:59');
      result = result.filter(h => {
        const d = parseHaltDate(h.haltTime);
        return d && d <= to;
      });
    }

    if (filters.resumptionDateFrom) {
      const from = new Date(filters.resumptionDateFrom + 'T00:00:00');
      result = result.filter(h => {
        const d = parseHaltDate(h.resumptionTime);
        return d && d >= from;
      });
    }

    if (filters.resumptionDateTo) {
      const to = new Date(filters.resumptionDateTo + 'T23:59:59');
      result = result.filter(h => {
        const d = parseHaltDate(h.resumptionTime);
        return d && d <= to;
      });
    }

    if (filters.haltType.trim()) {
      const ht = filters.haltType.trim().toUpperCase();
      result = result.filter(h => h.haltType?.toUpperCase().includes(ht));
    }

    if (filters.createdBy.trim()) {
      const cb = filters.createdBy.trim().toLowerCase();
      result = result.filter(h => h.createdBy?.toLowerCase().includes(cb));
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

  const hasActiveFilters = filters.haltDateFrom || filters.haltDateTo ||
    filters.resumptionDateFrom || filters.resumptionDateTo ||
    filters.haltType || filters.createdBy ||
    filters.symbol || filters.market.length > 0;

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
            label="Halt Date From"
            type="date"
            size="small"
            value={filters.haltDateFrom}
            onChange={e => handleFilterChange('haltDateFrom', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 155 }}
          />
          <TextField
            label="Halt Date To"
            type="date"
            size="small"
            value={filters.haltDateTo}
            onChange={e => handleFilterChange('haltDateTo', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 155 }}
          />
          <TextField
            label="Resumption Date From"
            type="date"
            size="small"
            value={filters.resumptionDateFrom}
            onChange={e => handleFilterChange('resumptionDateFrom', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 175 }}
          />
          <TextField
            label="Resumption Date To"
            type="date"
            size="small"
            value={filters.resumptionDateTo}
            onChange={e => handleFilterChange('resumptionDateTo', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 175 }}
          />
          <TextField
            label="Halt Type"
            size="small"
            value={filters.haltType}
            onChange={e => handleFilterChange('haltType', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="e.g. REG"
            sx={{ minWidth: 120 }}
          />
          <TextField
            label="Created By"
            size="small"
            value={filters.createdBy}
            onChange={e => handleFilterChange('createdBy', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="e.g. jsmith"
            sx={{ minWidth: 130 }}
          />
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
              {filters.haltDateFrom && (
                <Chip
                  size="small"
                  label={`Halt Date From: ${filters.haltDateFrom}`}
                  onDelete={() => handleFilterChange('haltDateFrom', '')}
                />
              )}
              {filters.haltDateTo && (
                <Chip
                  size="small"
                  label={`Halt Date To: ${filters.haltDateTo}`}
                  onDelete={() => handleFilterChange('haltDateTo', '')}
                />
              )}
              {filters.resumptionDateFrom && (
                <Chip
                  size="small"
                  label={`Resumption From: ${filters.resumptionDateFrom}`}
                  onDelete={() => handleFilterChange('resumptionDateFrom', '')}
                />
              )}
              {filters.resumptionDateTo && (
                <Chip
                  size="small"
                  label={`Resumption To: ${filters.resumptionDateTo}`}
                  onDelete={() => handleFilterChange('resumptionDateTo', '')}
                />
              )}
              {filters.haltType && (
                <Chip
                  size="small"
                  label={`Halt Type: ${filters.haltType}`}
                  onDelete={() => handleFilterChange('haltType', '')}
                />
              )}
              {filters.createdBy && (
                <Chip
                  size="small"
                  label={`Created By: ${filters.createdBy}`}
                  onDelete={() => handleFilterChange('createdBy', '')}
                />
              )}
              {filters.symbol && (
                <Chip
                  size="small"
                  label={`Symbol: ${filters.symbol.toUpperCase()}`}
                  onDelete={() => handleFilterChange('symbol', '')}
                />
              )}
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
