 import React, {useState} from 'react';
 import {
   Box, Table, TableBody, TableCell, TableContainer, TableHead,
   TableRow, Paper, FormControl, Select, MenuItem, InputLabel, TableSortLabel} from '@mui/material';
 import 'react-multi-carousel/lib/styles.css';
 import 'reactjs-popup/dist/index.css';
 import dayjs from 'dayjs';
 
 
 
 export default function LiftedTableTemplate({liftedData}) {
    const LiftedTableHeader = ['Halt ID','Symbol', 'Issue Name', 'Listing Market', 'Incl Sub', 'Created By', 'Halt Time', 'Resumption Time']

     const keyMap = {
            "Halt ID": "haltId",
            "Symbol": "symbol",
            "Issue Name": "issueName",
            "Listing Market": "listingMarket",
            'Incl Sub': "allIssue",
            "Created By": "createdBy",
            "Halt Time": "haltTime",
            "Resumption Time": "resumptionTime"
        };
    
        const defaultOrderBy = localStorage.getItem("todayLiftedOrderedBy") || "haltTime";
        const defaultOrderDirection = localStorage.getItem("todayLiftedOrderedDirection") || "desc";
        
        const [orderBy, setOrderBy] = useState(defaultOrderBy);
        const [orderDirection, setOrderDirection] = useState(defaultOrderDirection);
    
        const handleSortRequest = (columnKey) => {
            const isAsc = orderBy === columnKey && orderDirection === 'asc';
            const newDirection = isAsc ? 'desc' : 'asc';
            setOrderBy(columnKey);
            setOrderDirection(newDirection);
            localStorage.setItem("todayLiftedOrderedBy", columnKey);
            localStorage.setItem("todayLiftedOrderedDirection", newDirection);
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
          
    const sortedRows = sortRows(liftedData);
   
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
                        localStorage.setItem("todayLiftedOrderedBy", val);
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
                        localStorage.setItem("todayLiftedOrderDirection", val);
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
            <TableHead sx={{ backgroundColor: '#006666' }}>
                <TableRow>
                   {LiftedTableHeader.map((head) => (
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
                {sortedRows.map((row, index) => (
                <TableRow key={index} sx={{ backgroundColor: 'white' }}>
                    <TableCell>{row.haltId}</TableCell>
                    <TableCell>{row.symbol}</TableCell>
                    <TableCell>{row.issueName}</TableCell>
                    <TableCell>{row.listingMarket}</TableCell>
                    <TableCell>{row.allIssue}</TableCell>
                    <TableCell>{row.createdBy}</TableCell>
                    <TableCell>{row.haltTime}</TableCell>
                    <TableCell>{row.resumptionTime}</TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </TableContainer>
        </div>
    )
  }