import { useState } from 'react';
import HaltTable from './HaltTable';
import { Tooltip } from "@mui/material";
import CancelHaltModal from './CancelHaltModal';

const PendingTable = ({ data, onHaltIdClick, onHaltCancelled }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);

  const handleCancelClick = (row) => {
    setSelectedHalt(row);
    setCancelModalOpen(true);
  };

  const handleCancelModalClose = () => {
    setCancelModalOpen(false);
    setSelectedHalt(null);
  };

  const renderPendingAction = (row) => (
    <>
      <Tooltip
        title={`Edit Halt: ${row.symbol}-${row.haltId}`}
        arrow
      >
        <button className="halt-action-button">Edit</button>
      </Tooltip>
      <Tooltip
        title={`Cancel Halt: ${row.symbol}-${row.haltId}`}
        arrow
      >
        <button
          className="halt-action-button-red"
          onClick={() => handleCancelClick(row)}
        >
          Cancel
        </button>
      </Tooltip>
    </>
  );

  return (
    <>
      <HaltTable
        tableType="pending"
        data={data}
        showControls={false}
        showExtendedCheckbox={false}
        showActionButtons={false}
        renderActionCell={renderPendingAction}
        onHaltIdClick={onHaltIdClick}
      />
      <CancelHaltModal
        open={cancelModalOpen}
        onClose={handleCancelModalClose}
        haltData={selectedHalt}
        onHaltCancelled={onHaltCancelled}
      />
    </>
  );
};

export default PendingTable;