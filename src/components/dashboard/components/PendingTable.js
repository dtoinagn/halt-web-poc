import { useState } from 'react';
import HaltTable from './HaltTable';
import { Tooltip } from "@mui/material";
import CancelHaltModal from './CancelHaltModal';
import EditScheduledHaltModal from './EditScheduledHaltModal';

const PendingTable = ({ data, onHaltIdClick, onHaltCancelled }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);

  const handleEditClick = (row) => {
    setSelectedHalt(row);
    setEditModalOpen(true);
  };

  const handleCancelClick = (row) => {
    setSelectedHalt(row);
    setCancelModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedHalt(null);
  };

  const handleCancelModalClose = () => {
    setCancelModalOpen(false);
    setSelectedHalt(null);
  };
  const renderPendingAction = (row) => {
    // Hide both Edit and Cancel when the halt has been cancelled
    if (row.state === "HaltPendingCancelled" || row.state === "HaltPendingCancelling") {
      return null;
    }

    return (
      <>
        <Tooltip
          title={`Edit Halt: ${row.symbol}-${row.haltId}`}
          arrow
        >
          <button
            className="halt-action-button"
            onClick={() => handleEditClick(row)}
          >
            Edit
          </button>
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
  };

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
      <EditScheduledHaltModal
        open={editModalOpen}
        onClose={handleEditModalClose}
        haltData={selectedHalt}
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