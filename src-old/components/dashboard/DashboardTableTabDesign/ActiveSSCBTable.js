import React, {useState} from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TableSortLabel, MenuItem, Paper, FormControl, InputLabel, Select} from '@mui/material';
import 'react-multi-carousel/lib/styles.css';
import 'reactjs-popup/dist/index.css';

export default function ActiveSSCBTableTemplate({ activeSSCBData}) {
    const keyMap = {
        "Halt ID": "haltId",
        "Symbol": "symbol",
        "Issue Name": "issueName",
        "Listing Market": "listingMarket",
        "Halt Time": "haltTime",
        "Resumption Time": "resumptionTime"
    };

    const defaultOrderBy = localStorage.getItem("activeSSCBOrderedBy") || "haltTime";
    const defaultOrderDirection = localStorage.getItem("activeSSCBOrderDirection") || "desc";
    
    const [orderBy, setOrderBy] = useState(defaultOrderBy);
    const [orderDirection, setOrderDirection] = useState(defaultOrderDirection);

    const handleSortRequest = (columnKey) => {
        const isAsc = orderBy === columnKey && orderDirection === 'asc';
        const newDirection = isAsc ? 'desc' : 'asc';
        setOrderBy(columnKey);
        setOrderDirection(newDirection);
        localStorage.setItem("activeSSCBOrderedBy", columnKey);
        localStorage.setItem("activeSSCBOrderDirection", newDirection);
    };
    
    const sortRows = (rows) => {
        return [...rows].sort((a, b) => {
        let aVal = a[orderBy];
        let bVal = b[orderBy];
    
        const isDate = val => typeof val === "string" && /\d{4}-\d{2}-\d{2}T/.test(val);
        if (isDate(aVal)) aVal = new Date(aVal);
        if (isDate(bVal)) bVal = new Date(bVal);
    
        if (aVal < bVal) return orderDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return orderDirection === "asc" ? 1 : -1;
        return 0;
        });
    };
      
    const sortedRows = sortRows(activeSSCBData);
    return (
        <div>
            <Box
                sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 3,
                mt: 5,
                mr: 2,
                flexWrap: 'wrap', 
                }}
            >

                <Box sx={{ display: 'flex', gap: 3 }}>
                <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                    value={orderBy}
                    label="Sort By"
                    onChange={(e) => {
                        const val = e.target.value;
                        setOrderBy(val);
                        localStorage.setItem("activeSSCBOrderedBy", val);
                    }}
                    >
                    {Object.entries(keyMap).map(([label, value]) => (
                        <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 140 }}>
                    <InputLabel>Direction</InputLabel>
                    <Select
                    value={orderDirection}
                    label="Direction"
                    onChange={(e) => {
                        const val = e.target.value;
                        setOrderDirection(val);
                        localStorage.setItem("activeSSCBOrderDirection", val);
                    }}
                    >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                </FormControl>

                </Box>
            </Box>
          <TableContainer component={Paper} sx={{ backgroundColor: '#7d9c9c', marginTop: 7, maxHeight: 580, overflowY: 'auto' }}>
            <Table stickyHeader>
                  <TableHead>
                  <TableRow sx={{ backgroundColor: '#006666'}}>
                      {['Halt ID', 'Symbol', 'Issue Name', 'Listing Market', 'Halt Time', 'Resumption Time', '  '].map((head) => (
                      <TableCell key={head} sx={{ color: 'white', fontWeight: 'bold', position: 'sticky', top: 0, zIndex: 1, backgroundColor: '#006666' }}>
                           {keyMap[head] ? (
                                <TableSortLabel
                                    active={orderBy === keyMap[head]}
                                    direction={orderBy === keyMap[head] ? orderDirection : 'asc'}
                                    onClick={() => handleSortRequest(keyMap[head])}
                                    sx={{ color: 'white' }}
                                >
                                    {head}
                                </TableSortLabel>
                            ) : head}
                      </TableCell>
                      ))}
                  </TableRow>
                  </TableHead>
                  <TableBody>
                  {sortedRows.map((row, idx) => (
                      <TableRow key={idx} sx={{ backgroundColor: 'white' }}>
                      <TableCell>{row.haltId}</TableCell>
                      <TableCell>{row.symbol}</TableCell>
                      <TableCell>{row.issueName}</TableCell>
                      <TableCell>{row.listingMarket}</TableCell>
                      <TableCell>{row.haltTime}</TableCell>
                      <TableCell>{row.resumptionTime}</TableCell>
                      <TableCell><button>Extend Halt</button></TableCell>
                      </TableRow>
                  ))}
                  </TableBody>
              </Table>
          </TableContainer>
        </div>
    )
  }