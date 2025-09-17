import React, { useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TableSortLabel,
  Tooltip,
} from "@mui/material";
import ErrorDialog from "../../ui/ErrorDialog";
import { TABLE_COLUMNS, COLUMN_KEY_MAP } from "../../../constants";
import { sortUtils, hideExtendedUtils } from "../../../utils/storageUtils";

const HaltTable = ({
  tableType,
  data,
  activeRegHaltList = [],
  notExtendedList = [],
  onExtendedHaltUpdate,
  showControls = false,
  showExtendedCheckbox = false,
  showActionButtons = false,
}) => {
  // Get table-specific columns and sort preferences
  const tableTypeKey =
    tableType === "activeReg"
      ? "ACTIVE_REG"
      : tableType === "activeSSCB"
        ? "ACTIVE_SSCB"
        : tableType.toUpperCase();
  const columns = TABLE_COLUMNS[tableTypeKey] || [];
  const sortPrefKey = `${tableType}OrderedBy`;
  const sortDirPrefKey = `${tableType}OrderDirection`;

  // Extended halt visibility (only for ActiveReg)
  const [hideExtended, setHideExtended] = useState(
    showExtendedCheckbox ? hideExtendedUtils.get() : false
  );

  // Confirmation dialog state (only for ActiveReg)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    rowIndex: null,
    newValue: null,
    haltId: null,
  });

  const [errorDialog, setErrorDialog] = useState({
    open: false,
    message: "",
  });

  // Sorting state
  const defaultOrderBy = sortUtils.getSortPreference(sortPrefKey) || "haltTime";
  const defaultOrderDirection =
    sortUtils.getSortPreference(sortDirPrefKey) || "desc";
  const [orderBy, setOrderBy] = useState(defaultOrderBy);
  const [orderDirection, setOrderDirection] = useState(defaultOrderDirection);

  const handleSortRequest = (columnKey) => {
    const isAsc = orderBy === columnKey && orderDirection === "asc";
    const newDirection = isAsc ? "desc" : "asc";
    setOrderBy(columnKey);
    setOrderDirection(newDirection);
    sortUtils.setSortPreference(sortPrefKey, columnKey);
    sortUtils.setSortPreference(sortDirPrefKey, newDirection);
  };

  const sortRows = (rows) => {
    return [...rows].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];

      const isDate = (val) =>
        typeof val === "string" && /\d{4}-\d{2}-\d{2}/.test(val);
      if (isDate(aVal)) aVal = new Date(aVal);
      if (isDate(bVal)) bVal = new Date(bVal);

      if (aVal < bVal) return orderDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return orderDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Filter rows based on extended halt visibility (only for ActiveReg)
  const visibleRows =
    showExtendedCheckbox && hideExtended
      ? data.filter((row) => !row.extendedHalt)
      : data;

  const sortedRows = sortRows(visibleRows);

  // Debug logging
  console.log("HaltTable Debug:", {
    tableType,
    tableTypeKey,
    columns,
    dataLength: data.length,
    sortedRowsLength: sortedRows.length,
    firstRow: sortedRows[0],
  });

  const handleExtendHalt = (row, index) => {
    setConfirmDialog({
      open: true,
      rowIndex: index,
      newValue: !row.extendedHalt,
      haltId: row.haltId,
    });
  };

  const handleDialogClose = async (confirm) => {
    if (confirm && confirmDialog.haltId && onExtendedHaltUpdate) {
      const result = await onExtendedHaltUpdate(confirmDialog.haltId, confirmDialog.newValue);
      if (result && result.error) {
        setErrorDialog({
          open: true,
          message: result.error,
        });
      }
    }

    setConfirmDialog({
      open: false,
      rowIndex: null,
      newValue: null,
      haltId: null,
    });
  };
  const handleErrorDialogClose = () => {
    setErrorDialog({
      open: false,
      message: "",
    });
  };

  const toggleHideExtended = () => {
    const newValue = !hideExtended;
    hideExtendedUtils.set(newValue);
    setHideExtended(newValue);
  };

  const renderTableCell = (row, columnHeader, idx) => {
    const cellContent =
      row[COLUMN_KEY_MAP[columnHeader] || columnHeader.toLowerCase()] || "";

    // Handle special columns
    switch (columnHeader) {
      case "Extended Halt":
        return (
          <TableCell
            key={idx}
            sx={{ padding: "2px 4px", minWidth: "40px", maxWidth: "60px" }}
          >
            <Checkbox
              checked={row.extendedHalt || false}
              onChange={() => handleExtendHalt(row, idx)}
              size="small"
            />
          </TableCell>
        );

      case " ":
        return (
          <TableCell
            key={idx}
            sx={{ padding: "2px 4px", minWidth: "80px", maxWidth: "100px" }}
          >
            <button
              style={{
                fontSize: "0.7rem",
                padding: "1px 4px",
                whiteSpace: "nowrap",
              }}
            >
              Resume Trading
            </button>
          </TableCell>
        );

      case "   ":
        return (
          <TableCell
            key={idx}
            sx={{ padding: "2px 4px", minWidth: "80px", maxWidth: "100px" }}
          >
            {row.resumptionTime ? (
              <Tooltip title={`Cancel scheduled resumption`} arrow>
                <button
                  style={{
                    fontSize: "0.7rem",
                    padding: "1px 4px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Cancel
                </button>
              </Tooltip>
            ) : null}
          </TableCell>
        );

      default:
        return (
          <TableCell
            key={idx}
            sx={{
              padding: "2px 4px",
              fontSize: "0.75rem",
              minWidth: "60px",
              maxWidth: "120px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {cellContent}
          </TableCell>
        );
    }
  };

  return (
    <div>
      {showControls && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 3,
            mt: 5,
            mr: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 3 }}>
            <FormControl sx={{ minWidth: 140 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={orderBy}
                label="Sort By"
                onChange={(e) => {
                  const val = e.target.value;
                  setOrderBy(val);
                  sortUtils.setSortPreference(sortPrefKey, val);
                }}
              >
                {Object.entries(COLUMN_KEY_MAP).map(([label, value]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
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
                  sortUtils.setSortPreference(sortDirPrefKey, val);
                }}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>

            {showExtendedCheckbox && (
              <>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={hideExtended}
                      onChange={toggleHideExtended}
                      color="default"
                    />
                  }
                  label="Hide extended halt"
                  sx={{ m: 0 }}
                />
                {hideExtended && (
                  <button className="hidden-halt-num">
                    {activeRegHaltList.length - notExtendedList.length}
                  </button>
                )}
              </>
            )}
          </Box>
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: "#7d9c9c",
          marginTop: 2,
          maxHeight: "calc(100vh - 280px)",
          overflowY: sortedRows.length > 10 ? "auto" : "hidden",
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#006666" }}>
              {columns.map((head, idx) => (
                <TableCell
                  key={idx}
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    backgroundColor: "#006666",
                    padding: "4px 6px",
                    fontSize: "0.8rem",
                    minWidth: "60px",
                    maxWidth: "120px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {COLUMN_KEY_MAP[head] ? (
                    <TableSortLabel
                      active={orderBy === COLUMN_KEY_MAP[head]}
                      direction={
                        orderBy === COLUMN_KEY_MAP[head]
                          ? orderDirection
                          : "asc"
                      }
                      onClick={() => handleSortRequest(COLUMN_KEY_MAP[head])}
                      sx={{ color: "white" }}
                    >
                      {head}
                    </TableSortLabel>
                  ) : (
                    head
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, idx) => (
              <TableRow
                key={idx}
                sx={{ backgroundColor: "white", height: "40px" }}
              >
                {columns.map((columnHeader, cellIdx) =>
                  renderTableCell(row, columnHeader, cellIdx)
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showActionButtons && (
        <>
        <Dialog
          open={confirmDialog.open}
          onClose={(event, reason) => {
            if (reason === 'backdropClick') {
            return; // Prevent closing on backdrop click
            }
            handleDialogClose(false);
       }}
        >
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogContent>
            {confirmDialog.newValue ? (
              <>
                Are you sure you want to <strong>extend</strong> this halt with
                halt ID <strong>{confirmDialog.haltId}</strong>?
              </>
            ) : (
              <>
                Are you sure you want to <strong>cancel the extend</strong> of
                this halt with halt ID <strong>{confirmDialog.haltId}</strong>?
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleDialogClose(false)} color="error">
              No
            </Button>
            <Button
              onClick={() => handleDialogClose(true)}
              color="primary"
              autoFocus
            >
              Yes
            </Button>
          </DialogActions>
        </Dialog>
          <ErrorDialog
            open={errorDialog.open}
            message={errorDialog.message}
            onClose={handleErrorDialogClose}
          />
        </>
      )}
    </div>
  );
};

export default HaltTable;
