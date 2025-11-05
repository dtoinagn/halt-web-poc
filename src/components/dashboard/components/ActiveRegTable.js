import { useState } from 'react';
import HaltTable from './HaltTable';
import { Tooltip } from "@mui/material";
import ResumeHaltModal from './ResumeHaltModal';

const ActiveRegTable = ({
  data,
  activeRegHaltList,
  notExtendedList,
  onExtendedHaltUpdate,
  onHaltIdClick
}) => {
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);

  const handleResumeClick = (row) => {
    setSelectedHalt(row);
    setResumeModalOpen(true);
  };

  const handleResumeModalClose = () => {
    setResumeModalOpen(false);
    setSelectedHalt(null);
  };

  const renderActiveRegAction = (row) => (
    <>
      <Tooltip
        title={`Schedule a resumption: ${row.symbol}-${row.haltId}`}
        arrow
      >
        <button
          className="halt-action-button"
          onClick={() => handleResumeClick(row)}
        >
          Create/Edit Resumption
        </button>
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

  return (
    <>
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
        onHaltIdClick={onHaltIdClick}
      />
      <ResumeHaltModal
        open={resumeModalOpen}
        onClose={handleResumeModalClose}
        haltData={selectedHalt}
        onHaltUpdated={onExtendedHaltUpdate}
      />
    </>
  );
};

export default ActiveRegTable;