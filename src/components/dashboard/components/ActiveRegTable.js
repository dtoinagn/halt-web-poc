import { useState } from 'react';
import HaltTable from './HaltTable';
import { Tooltip } from "@mui/material";
import ResumeHaltModal from './ResumeHaltModal';
import CancelResumptionModal from './CancelResumptionModal';
import RemainHaltModal from './RemainHaltModal';

const ActiveRegTable = ({
  data,
  activeRegHaltList,
  extendedRegHaltIds,
  onExtendedHaltUpdate,
  onRemainedHaltUpdate,
  onHaltIdClick,
  securities = [],
  remainReasons = [],
}) => {
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [cancelResumptionModalOpen, setCancelResumptionModalOpen] = useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);
  const [remainModalOpen, setRemainModalOpen] = useState(false);
  const [remainModalHalt, setRemainModalHalt] = useState(null);

  const handleResumeClick = (row) => {
    setSelectedHalt(row);
    setResumeModalOpen(true);
  };

  const handleResumeModalClose = () => {
    setResumeModalOpen(false);
    setSelectedHalt(null);
  };

  const handleCancelResumptionClick = (row) => {
    setSelectedHalt(row);
    setCancelResumptionModalOpen(true);
  };

  const handleCancelResumptionModalClose = () => {
    setCancelResumptionModalOpen(false);
    setSelectedHalt(null);
  };

  const handleOpenRemainModal = (row) => {
    setRemainModalHalt(row);
    setRemainModalOpen(true);
  };

  const handleCloseRemainModal = () => {
    setRemainModalOpen(false);
    setRemainModalHalt(null);
  };

  const handleRemainSuccess = async (remainedHalt, remainReason) => {
    if (onRemainedHaltUpdate && remainModalHalt) {
      await onRemainedHaltUpdate(remainModalHalt.haltId, remainedHalt, remainReason);
    }
    handleCloseRemainModal();
  };

  const renderActiveRegAction = (row) => (
    <>
      {row.resumptionTime ? (
        <Tooltip
          title={`Edit scheduled resumption: ${row.haltId}`}
          arrow
        >
          <button
            className="halt-action-button"
            onClick={() => handleResumeClick(row)}
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
      />
      <CancelResumptionModal
        open={cancelResumptionModalOpen}
        onClose={handleCancelResumptionModalClose}
        haltData={selectedHalt}
        onResumptionCancelled={onRemainedHaltUpdate}
      />
      <RemainHaltModal
        open={remainModalOpen}
        onClose={handleCloseRemainModal}
        haltData={remainModalHalt}
        remainReasons={remainReasons}
        onSuccess={handleRemainSuccess}
      />
    </>
  );
};

export default ActiveRegTable;