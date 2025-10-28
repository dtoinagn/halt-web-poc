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
  FormControlLabel,
  TableSortLabel,
} from "@mui/material";
import ErrorDialog from "../../ui/ErrorDialog";
import ConfirmDialog from "../../ui/ConfirmDialog";
import { TABLE_COLUMNS, COLUMN_KEY_MAP } from "../../../constants";
import { sortUtils, hideExtendedUtils } from "../../../utils/storageUtils";
import { formatDateTimeForDashboard } from "../../../utils/dateUtils";

const HaltTable = ({
  tableType,
  data,
  activeRegHaltList = [],
  notExtendedList = [],
  onExtendedHaltUpdate,
  showControls = false,
  showExtendedCheckbox = false,
  showActionButtons = false,
  renderActionCell, // Optional custom cell renderer for action column
  onHaltIdClick, // Optional click handler for Halt Event ID
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
  const handleExtendHalt = (row, index) => {
    setConfirmDialog({
      open: true,
      rowIndex: index,
      newValue: !row.extendedHalt,
      haltId: row.haltId,
      symbol: row.symbol,
    });
  };

  const handleConfirmDialog = async () => {
    if (confirmDialog.haltId && onExtendedHaltUpdate) {
      const result = await onExtendedHaltUpdate(
        confirmDialog.haltId,
        confirmDialog.newValue,
        confirmDialog.symbol
      );
      if (result && result.error) {
        setErrorDialog({
          open: true,
          message: result.error,
        });
      }
    }
    handleCancelDialog();
  };

  const handleCancelDialog = () => {
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
      case "Halt Event ID":
        return (
          <TableCell
            key={idx}
            sx={{
              padding: "2px 4px",
              fontSize: "0.75rem",
              minWidth: "10px",
              maxWidth: "120px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {onHaltIdClick ? (
              <Box
                component="span"
                onClick={() => onHaltIdClick(row)}
                sx={{
                  color: "#1976d2",
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "none",
                  borderBottom: "1px solid transparent",
                  transition: "all 0.2s ease",
                  padding: "2px 0",
                  "&:hover": {
                    color: "#1565c0",
                    borderBottomColor: "#1565c0",
                  },
                  "&:active": {
                    color: "#0d47a1",
                  }
                }}
              >
                {cellContent}
              </Box>
            ) : (
              cellContent
            )}
          </TableCell>
        );

      case "Halt Time":
      case "Sched Resumption Time":
      case "Sched Halt Time":
        // Data should already be formatted by processHaltData, so just display it
        return (
          <TableCell
            key={idx}
            sx={{
              padding: "2px 4px",
              fontSize: "0.75rem",
              minWidth: "120px",
              maxWidth: "150px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {cellContent ? formatDateTimeForDashboard(cellContent) : ""}
          </TableCell>
        );

      case "Extd":
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

      case "Action":
        return (
          <TableCell
            key={idx}
            sx={{ padding: "2px 4px", minWidth: "100px", maxWidth: "300px" }}
          >
            {renderActionCell ? renderActionCell(row) : null}
          </TableCell>
        );
      default:
        return (
          <TableCell
            key={idx}
            sx={{
              padding: "2px 4px",
              fontSize: "0.75rem",
              minWidth: "10px",
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
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          textAlign="center"
          width="95%"
          marginTop={1}
          flex={1}
          position="relative"
        >
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
                sx={{ marginLeft: 1 }}
              />
              {hideExtended && (
                <button className="hidden-halt-num">
                  {activeRegHaltList.length - notExtendedList.length}
                </button>
              )}
            </>
          )}
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
                sx={{
                  backgroundColor: "white",
                  height: "40px",
                  "&:hover": { backgroundColor: "#f0f8f8" },
                }}
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
          <ConfirmDialog
            open={confirmDialog.open}
            title="Confirm Action"
            message={
              confirmDialog.newValue ? (
                <>
                  Are you sure you want to <strong>extend</strong> this halt
                  with halt ID <strong>{confirmDialog.haltId}</strong> for
                  symbol <strong>{confirmDialog.symbol}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to <strong>cancel the extend</strong> of
                  this halt with halt ID <strong>{confirmDialog.haltId}</strong>{" "}
                  for symbol <strong>{confirmDialog.symbol}</strong>?
                </>
              )
            }
            onConfirm={handleConfirmDialog}
            onCancel={handleCancelDialog}
            confirmText="Yes"
            cancelText="No"
            severity="warning"
          />
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
