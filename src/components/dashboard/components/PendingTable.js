import React from 'react';
import HaltTable from './HaltTable';
import { Tooltip } from "@mui/material";

const PendingTable = ({ data }) => {
  return (
    <HaltTable
      tableType="pending"
      data={data}
      showControls={false}
      showExtendedCheckbox={false}
      showActionButtons={false}
      renderActionCell={renderPendingAction}
    />
  );
};

const renderPendingAction = (row) => (
  <>
    <Tooltip
      title={`Edit/Cancel Schedule: ${row.symbol}-${row.haltId}`}
      arrow
    >
      <button className="halt-action-button">Edit</button>
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

export default PendingTable;