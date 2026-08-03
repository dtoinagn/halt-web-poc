import { useState } from 'react';
import HaltTable from './HaltTable';
import { HALT_ACTIONS, HALT_STATES } from "../../../constants/index";
import { Tooltip } from "@mui/material";
import CancelHaltModal from './CancelHaltModal';
import EditScheduledHaltModal from './EditScheduledHaltModal';

const PendingTable = ({ data, onHaltIdClick, onHaltCancelled, haltReasons = [] }) => {
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleEditClick = (row, action = null) => {
    setSelectedHalt(row);
    setSelectedAction(action);
    setEditModalOpen(true);
  };

  const handleCancelClick = (row, action = null) => {
    setSelectedHalt(row);
    setSelectedAction(action);
    setCancelModalOpen(true);
  };

  const handleSubmitClick = (row, action = null) => {
    setSelectedHalt(row);
    setSelectedAction(action);
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedHalt(null);
    setSelectedAction(null);
  };

  const handleCancelModalClose = () => {
    setCancelModalOpen(false);
    setSelectedHalt(null);
    setSelectedAction(null);
  };
  const renderPendingAction = (row) => {
    // Hide both Edit and Cancel when the halt has been cancelled
    if (row.subState === "Pending_Halt_Cancelled" || row.subState === "Pending_Halt_Canceling") {
      return null;
    }

    const editAction = row.state === HALT_STATES.DRAFT_REG_HALT
      ? HALT_ACTIONS.MODIFY_HALT_DRAFT
      : HALT_ACTIONS.MODIFY_SCHEDULED_HALT;
    const submitAction = HALT_ACTIONS.SUBMIT_HALT_DRAFT;
    const cancelAction = row.state === HALT_STATES.DRAFT_REG_HALT
      ? HALT_ACTIONS.CANCEL_HALT_DRAFT
      : HALT_ACTIONS.CANCEL_SCHEDULED_HALT;

    if (row.state === HALT_STATES.DRAFT_REG_HALT) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <Tooltip
            title={`Edit Draft Halt: ${row.haltId}`}
            arrow
          >
            <button
              className="halt-action-button"
              action={editAction}
              data-action={editAction}
              onClick={() => handleEditClick(row, editAction)}
              style={{ marginLeft: 0 }}
            >
              Edit Drafted Halt
            </button>
          </Tooltip>

          <Tooltip
            title={`Submit Draft Halt: ${row.haltId}`}
            arrow
          >
            <button
              className="halt-action-button-red"
              action={submitAction}
              data-action={submitAction}
              onClick={() => handleSubmitClick(row, submitAction)}
              style={{ marginLeft: 0 }}
            >
              Submit Drafted Halt
            </button>
          </Tooltip>

          <Tooltip
            title={`Cancel Draft Halt: ${row.haltId}`}
            arrow
          >
            <button
              className="halt-action-button"
              action={cancelAction}
              data-action={cancelAction}
              onClick={() => handleCancelClick(row, cancelAction)}
              style={{ marginLeft: 0 }}
            >
              Cancel Drafted Halt
            </button>
          </Tooltip>
        </div>
      );
    }

    return (
      <>
        <Tooltip
          title={`Edit Halt: ${row.haltId}`}
          arrow
        >
          <button
            className="halt-action-button"
            action={editAction}
            data-action={editAction}
            onClick={() => handleEditClick(row, editAction)}
            style={{ marginLeft: 0 }}
          >
            Edit
          </button>
        </Tooltip>

        <Tooltip
          title={`Cancel Halt: ${row.haltId}`}
          arrow
        >
          <button
            className="halt-action-button-red"
            action={cancelAction}
            data-action={cancelAction}
            onClick={() => handleCancelClick(row, cancelAction)}
            style={{ marginLeft: 0 }}
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
        action={selectedAction}
        haltReasons={haltReasons}
      />
      <CancelHaltModal
        open={cancelModalOpen}
        onClose={handleCancelModalClose}
        haltData={selectedHalt}
        action={selectedAction}
        onHaltCancelled={onHaltCancelled}
      />
    </>
  );
};

export default PendingTable;