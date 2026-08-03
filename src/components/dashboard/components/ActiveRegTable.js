import { useState } from 'react';
import HaltTable from './HaltTable';
import { Tooltip } from "@mui/material";
import ResumeHaltModal from './ResumeHaltModal';
import CancelResumptionModal from './CancelResumptionModal';
import RemainHaltModal from './RemainHaltModal';
import EditHaltReasonModal from './EditHaltReasonModal';
import { HALT_ACTIONS } from "../../../constants";

const ActiveRegTable = ({
  data,
  activeRegHaltList,
  extendedRegHaltIds,
  onExtendedHaltUpdate,
  onRemainedHaltUpdate,
  onHaltIdClick,
  securities = [],
  remainReasons = [],
  haltReasons = [],
  onHaltUpdated,
}) => {
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [cancelResumptionModalOpen, setCancelResumptionModalOpen] = useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [remainModalOpen, setRemainModalOpen] = useState(false);
  const [remainModalHalt, setRemainModalHalt] = useState(null);
  const [editHaltReasonModalOpen, setEditHaltReasonModalOpen] = useState(false);

  const handleResumeClick = (row, action = null) => {
    setSelectedHalt(row);
    setSelectedAction(action);
    setResumeModalOpen(true);
  };

  const handleResumeModalClose = () => {
    setResumeModalOpen(false);
    setSelectedHalt(null);
    setSelectedAction(null);
  };

  const handleCancelResumptionClick = (row, action = null) => {
    setSelectedHalt(row);
    setSelectedAction(action);
    setCancelResumptionModalOpen(true);
  };

  const handleCancelResumptionModalClose = () => {
    setCancelResumptionModalOpen(false);
    setSelectedHalt(null);
    setSelectedAction(null);
  };

  const handleOpenRemainModal = (row) => {
    setRemainModalHalt(row);
    setRemainModalOpen(true);
  };

  const handleCloseRemainModal = () => {
    setRemainModalOpen(false);
    setRemainModalHalt(null);
  };

  const handleEditHaltReasonClick = (row) => {
    setSelectedHalt(row);
    setEditHaltReasonModalOpen(true);
  };

  const handleEditHaltReasonModalClose = () => {
    setEditHaltReasonModalOpen(false);
    setSelectedHalt(null);
  };

  const handleRemainSuccess = async (remainedHalt, remainReason) => {
    if (onRemainedHaltUpdate && remainModalHalt) {
      await onRemainedHaltUpdate(remainModalHalt.haltId, remainedHalt, remainReason);
    }
    handleCloseRemainModal();
  };

  const renderActiveRegAction = (row) => {
    if (row.subState === "Resumption_Drafted") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
          <Tooltip
            title={`Edit drafted resumption: ${row.haltId}`}
            arrow
          >
            <button
              className="halt-action-button"
              onClick={() => handleResumeClick(row, HALT_ACTIONS.MODIFY_RESUMPTION_DRAFT)}
              style={{ marginLeft: 0 }}
            >
              Edit Drafted Resumption
            </button>
          </Tooltip>

          <Tooltip
            title={`Edit halt reason: ${row.haltId}`}
            arrow
          >
            <button
              className="halt-action-button"
              onClick={() => handleEditHaltReasonClick(row)}
              style={{ marginLeft: 0 }}
            >
              Edit Halt Reason
            </button>
          </Tooltip>

          <Tooltip
            title={`Submit drafted resumption: ${row.haltId}`}
            arrow
          >
            <button
              className="halt-action-button-red"
              onClick={() => handleResumeClick(row, HALT_ACTIONS.SUBMIT_RESUMPTION_DRAFT)}
              style={{ marginLeft: 0 }}
            >
              Submit Drafted Resumption
            </button>
          </Tooltip>

          <Tooltip
            title={`Cancel drafted resumption: ${row.haltId}`}
            arrow
          >
            <button
              className="halt-action-button"
              onClick={() => handleCancelResumptionClick(row, HALT_ACTIONS.CANCEL_RESUMPTION_DRAFT)}
              style={{ marginLeft: 0 }}
            >
              Cancel Drafted Resumption
            </button>
          </Tooltip>
        </div>
      );
    }

    return (
    <>
      {row.resumptionTime ? (
        <Tooltip
          title={`Edit scheduled resumption: ${row.haltId}`}
          arrow
        >
          <button
            className="halt-action-button"
            onClick={() => handleResumeClick(row, HALT_ACTIONS.MODIFY_SCHEDULED_RESUMPTION)}
            style={{ marginLeft: 0 }}
          >
            Edit Resumption
          </button>
        </Tooltip>

      ) : (
        <Tooltip
          title={`Schedule a resumption: ${row.haltId}`}
          arrow
        >
          <button
            className="halt-action-button"
            onClick={() => handleResumeClick(row)}
            style={{ marginLeft: 0 }}
          >
            Resume Trading
          </button>
        </Tooltip>
      )}
      <Tooltip
        title={`Edit halt reason: ${row.haltId}`}
        arrow
      >
        <button
          className="halt-action-button"
          onClick={() => handleEditHaltReasonClick(row)}
          style={{ marginLeft: 0 }}
        >
          Edit Halt Reason
        </button>
      </Tooltip>
      {row.resumptionTime ? (
        <Tooltip
          title={`Cancel scheduled resumption: ${row.haltId}`}
          arrow
        >
          <button
            className="halt-action-button"
            onClick={() => handleCancelResumptionClick(row)}
            style={{ marginLeft: 0 }}
          >
            Cancel Resumption
          </button>
        </Tooltip>

      ) : (null)
      }
    </>
    );
  };

  return (
    <>
      <HaltTable
        tableType="activeReg"
        data={data}
        remainReasons={remainReasons}
        activeRegHaltList={activeRegHaltList}
        extendedRegHaltIds={extendedRegHaltIds}
        onExtendedHaltUpdate={onExtendedHaltUpdate}
        onRemainedHaltUpdate={onRemainedHaltUpdate}
        onOpenRemainModal={handleOpenRemainModal}
        showControls={true}
        showExtendedCheckbox={true}
        showActionButtons={true}
        renderActionCell={renderActiveRegAction}
        onHaltIdClick={onHaltIdClick}
      />
      <ResumeHaltModal
        open={resumeModalOpen}
        onClose={handleResumeModalClose}
        haltData={selectedHalt}
        securities={securities}
        action={selectedAction}
      />
      <CancelResumptionModal
        open={cancelResumptionModalOpen}
        onClose={handleCancelResumptionModalClose}
        haltData={selectedHalt}
        action={selectedAction}
        onResumptionCancelled={onRemainedHaltUpdate}
      />
      <RemainHaltModal
        open={remainModalOpen}
        onClose={handleCloseRemainModal}
        haltData={remainModalHalt}
        remainReasons={remainReasons}
        onSuccess={handleRemainSuccess}
      />
      <EditHaltReasonModal
        open={editHaltReasonModalOpen}
        onClose={handleEditHaltReasonModalClose}
        haltData={selectedHalt}
        haltReasons={haltReasons}
        onHaltUpdated={onHaltUpdated}
      />
    </>
  );
};

export default ActiveRegTable;