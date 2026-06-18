import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Divider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Alert,
} from '@mui/material';
import { formatDateTimeForDashboard } from '../../utils/dateUtils';
import './DailySummary.css';

const todayStr = () => new Date().toISOString().slice(0, 10);

// Replace with apiService.fetchDailySummary(date) when endpoint is available
const fetchSummary = async (date) => {
  await new Promise(r => setTimeout(r, 500));
  return {
    date,
    total: 21,
    byStatus: {
      LIFTED: 12,
      ACTIVE_REG_HALT: 2,
      ACTIVE_SSCB_HALT: 1,
      PENDING_HALT: 3,
      EXPIRED: 2,
      CANCELLED: 1,
    },
    byType: [
      { type: 'REG',      label: 'Regulatory', count: 13, avgDurationMin: 45 },
      { type: 'SSCB',     label: 'SSCB',        count: 6,  avgDurationMin: 28 },
      { type: 'SSCB_REG', label: 'SSCB → REG',  count: 2,  avgDurationMin: 72 },
    ],
    unresolved: [
      { haltId: 'H-2026-0041', symbol: 'AAPL', haltType: 'REG',      state: 'PENDING_HALT', haltTime: '20260617-09:32:00.000', createdBy: 'jsmith' },
      { haltId: 'H-2026-0039', symbol: 'TSLA', haltType: 'SSCB',     state: 'PENDING_HALT', haltTime: '20260617-14:55:00.000', createdBy: 'alee'   },
      { haltId: 'H-2026-0038', symbol: 'NVDA', haltType: 'REG',      state: 'PENDING_HALT', haltTime: '20260617-13:20:00.000', createdBy: 'bwong'  },
      { haltId: 'H-2026-0035', symbol: 'META', haltType: 'SSCB_REG', state: 'EXPIRED',      haltTime: '20260617-11:45:00.000', createdBy: 'jsmith' },
      { haltId: 'H-2026-0033', symbol: 'AMZN', haltType: 'REG',      state: 'EXPIRED',      haltTime: '20260617-10:05:00.000', createdBy: 'cpark'  },
      { haltId: 'H-2026-0030', symbol: 'MSFT', haltType: 'REG',      state: 'CANCELLED',    haltTime: '20260617-08:55:00.000', createdBy: 'bwong'  },
    ],
  };
};

const CHART_SLICES = [
  { key: 'LIFTED',           label: 'Lifted',      color: '#2e7d32', bg: '#e8f5e9' },
  { key: 'ACTIVE_REG_HALT',  label: 'Active Reg',  color: '#e65100', bg: '#fff3e0' },
  { key: 'ACTIVE_SSCB_HALT', label: 'Active SSCB', color: '#b45309', bg: '#fffbeb' },
  { key: 'PENDING_HALT',     label: 'Pending',     color: '#1565c0', bg: '#e3f2fd' },
  { key: 'EXPIRED',          label: 'Expired',     color: '#616161', bg: '#f5f5f5' },
  { key: 'CANCELLED',        label: 'Cancelled',   color: '#c62828', bg: '#ffebee' },
];

const STATE_META = Object.fromEntries(CHART_SLICES.map(s => [s.key, s]));

const fmtDuration = (min) => {
  if (!min && min !== 0) return '—';
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;
};

const polar = (cx, cy, angle, r) => ({
  x: cx + r * Math.cos(angle),
  y: cy + r * Math.sin(angle),
});

const DonutChart = ({ byStatus, total, size = 200 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.24;

  if (!total) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={outerR} fill="#e0e0e0" />
        <circle cx={cx} cy={cy} r={innerR} fill="white" />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize="13" fill="#999">No data</text>
      </svg>
    );
  }

  let startAngle = -Math.PI / 2;
  const slices = CHART_SLICES.map(s => {
    const value = byStatus[s.key] || 0;
    const angle = (value / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const slice = { ...s, value, startAngle, endAngle };
    startAngle = endAngle;
    return slice;
  }).filter(s => s.value > 0);

  const slicePath = ({ startAngle: sa, endAngle: ea }) => {
    const p1 = polar(cx, cy, sa, outerR);
    const p2 = polar(cx, cy, ea, outerR);
    const p3 = polar(cx, cy, ea, innerR);
    const p4 = polar(cx, cy, sa, innerR);
    const large = ea - sa > Math.PI ? 1 : 0;
    return [
      `M ${p1.x} ${p1.y}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y}`,
      `L ${p3.x} ${p3.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y}`,
      'Z',
    ].join(' ');
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <path key={i} d={slicePath(s)} fill={s.color} stroke="white" strokeWidth={2}>
          <title>{s.label}: {s.value}</title>
        </path>
      ))}
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="22" fontWeight="700" fill="#004644">{total}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="9" fill="#6d8584" letterSpacing="1">TOTAL</text>
    </svg>
  );
};

const DailySummary = () => {
  const [date, setDate] = useState(todayStr());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async (d) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSummary(d);
      setSummary(data);
    } catch (err) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSummary(date); }, [date, loadSummary]);

  const maxDuration = summary
    ? Math.max(...summary.byType.map(t => t.avgDurationMin), 1)
    : 1;

  return (
    <Box className="summary-container">
      {/* Header */}
      <Box className="summary-header">
        <Typography className="summary-title">Daily Halt Summary</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={e => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 148 }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={() => loadSummary(date)}
            className="summary-refresh-button"
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" height="60vh" gap={2}>
          <CircularProgress sx={{ color: '#006666' }} size={28} />
          <Typography color="#004644">Loading summary...</Typography>
        </Box>
      )}

      {error && (
        <Box p={3}>
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => loadSummary(date)}>Retry</Button>}
          >
            {error}
          </Alert>
        </Box>
      )}

      {!loading && !error && summary && (
        <>
          {/* Donut chart + legend */}
          <Paper className="summary-section" elevation={2}>
            <Typography className="summary-section-title">Halts by Status</Typography>
            <Box className="summary-chart-row">
              <DonutChart byStatus={summary.byStatus} total={summary.total} size={200} />
              <Box className="summary-legend">
                {CHART_SLICES.map(s => {
                  const count = summary.byStatus[s.key] || 0;
                  const pct = summary.total ? Math.round((count / summary.total) * 100) : 0;
                  return (
                    <Box key={s.key} className="summary-legend-row">
                      <Box className="summary-legend-dot" style={{ backgroundColor: s.color }} />
                      <Typography className="summary-legend-label">{s.label}</Typography>
                      <Typography className="summary-legend-count" style={{ color: s.color }}>{count}</Typography>
                      <Typography className="summary-legend-pct">{pct}%</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Paper>

          <Divider className="summary-divider" />

          {/* Halts by Type */}
          <Paper className="summary-section" elevation={2}>
            <Typography className="summary-section-title">Halts by Type</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {['Type', 'Count', '% of Total', 'Avg Duration'].map(h => (
                      <TableCell key={h} className="summary-table-header">{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.byType.map(row => (
                    <TableRow key={row.type} sx={{ '&:hover': { backgroundColor: '#f0f8f8' } }}>
                      <TableCell sx={{ fontSize: '0.8rem', fontWeight: 500 }}>{row.label}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>{row.count}</TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {summary.total ? `${Math.round((row.count / summary.total) * 100)}%` : '—'}
                      </TableCell>
                      <TableCell sx={{ minWidth: 240 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ flex: 1, height: 10, bgcolor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
                            <Box sx={{
                              width: `${Math.round((row.avgDurationMin / maxDuration) * 100)}%`,
                              height: '100%',
                              bgcolor: '#006666',
                              borderRadius: 5,
                            }} />
                          </Box>
                          <Typography sx={{ fontSize: '0.75rem', minWidth: 52, color: '#333' }}>
                            {fmtDuration(row.avgDurationMin)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Divider className="summary-divider" />

          {/* Unresolved Halts */}
          <Paper className="summary-section" elevation={2}>
            <Typography className="summary-section-title">
              Unresolved Halts
              <Typography component="span" className="summary-unresolved-count">
                {summary.unresolved.length} record{summary.unresolved.length !== 1 ? 's' : ''}
              </Typography>
            </Typography>
            {summary.unresolved.length === 0 ? (
              <Typography className="summary-no-unresolved">
                No unresolved halts for this date
              </Typography>
            ) : (
              <TableContainer className="summary-table-container">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      {['Symbol', 'Halt Event ID', 'Halt Type', 'State', 'Halt Time', 'Created By'].map(h => (
                        <TableCell key={h} className="summary-table-header">{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.unresolved.map((row, idx) => {
                      const meta = STATE_META[row.state] || { label: row.state, color: '#333', bg: '#f5f5f5' };
                      return (
                        <TableRow
                          key={`${row.haltId}-${idx}`}
                          sx={{ backgroundColor: 'white', '&:hover': { backgroundColor: '#f0f8f8' } }}
                        >
                          <TableCell sx={{ fontSize: '0.78rem', fontWeight: 600 }}>{row.symbol}</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', color: '#1976d2', fontWeight: 500 }}>{row.haltId}</TableCell>
                          <TableCell sx={{ fontSize: '0.78rem' }}>{row.haltType}</TableCell>
                          <TableCell>
                            <Box sx={{
                              display: 'inline-block',
                              px: 1, py: '2px',
                              borderRadius: 1,
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: meta.color,
                              backgroundColor: meta.bg,
                            }}>
                              {meta.label}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            {row.haltTime ? formatDateTimeForDashboard(row.haltTime) : ''}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.78rem' }}>{row.createdBy}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
          <Box sx={{ flexShrink: 0, height: 24 }} />
        </>
      )}
    </Box>
  );
};

export default DailySummary;
