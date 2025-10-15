import React from 'react';
import HaltTable from './HaltTable';
import { Tooltip } from "@mui/material";
const ActiveRegTable = ({
  data,
  activeRegHaltList,
  notExtendedList,
  onExtendedHaltUpdate
}) => {
  return (
    <HaltTable
      tableType="activeReg"
      data={data}
      activeRegHaltList={activeRegHaltList}
      notExtendedList={notExtendedList}
      onExtendedHaltUpdate={onExtendedHaltUpdate}
      showControls={true}
      showExtendedCheckbox={true}
      showActionButtons={true}
      renderActionCell={renderActiveRegAction}
    />
  );
};

const renderActiveRegAction = (row) => (
  <>
    <Tooltip
      title={`Schedule a resumption: ${row.symbol}-${row.haltId}`}
      arrow
    >
      <button className="halt-action-button">Resume Trading</button>
    </Tooltip>
    {row.resumptionTime ? (
      <Tooltip
        title={`Cancel scheduled resumption: ${row.symbol}-${row.haltId}`}
        arrow
      >
        <button className="halt-action-button">
          Cancel Resumption
        </button>
      </Tooltip>
    ) : null}
  </>
);

export default ActiveRegTable;