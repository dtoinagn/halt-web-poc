import { useState } from "react";
import HaltTable from "./HaltTable";
import { Tooltip } from "@mui/material";
import ProlongSSCBHaltModal from "./ProlongSSCBHaltModal";

const ActiveSSCBTable = ({ data, onHaltIdClick }) => {
  const [prolongSSCBHaltModalOpen, setProlongSSCBHaltModalOpen] =
    useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);

  const handleProlongHalt = (row) => {
    setSelectedHalt(row);
    setProlongSSCBHaltModalOpen(true);
  };

  const handleProlongModalClose = () => {
    setProlongSSCBHaltModalOpen(false);
    setSelectedHalt(null);
  };

  const renderSSCBAction = (row) => (
    <>
      <Tooltip title={`Prolong SSCB: ${row.haltId}`} arrow>
        <button
          className="halt-action-button"
          onClick={() => handleProlongHalt(row)}
          style={{ marginLeft: 0 }}
        >
          Prolong SSCB 5 Min
        </button>
      </Tooltip>
      {row.resumptionTime ? (
        <Tooltip title={`Convert: ${row.haltId}`} arrow>
          <button
            className="halt-action-button"
            style={{ marginLeft: 0 }}
          >
            Convert to Regulatory
          </button>
        </Tooltip>
      ) : null}
    </>
  );

  return (
    <>
      <HaltTable
        tableType="activeSSCB"
        data={data}
        showControls={false}
        showExtendedCheckbox={false}
        showActionButtons={false}
        renderActionCell={renderSSCBAction}
        onHaltIdClick={onHaltIdClick}
      />
      <ProlongSSCBHaltModal
        open={prolongSSCBHaltModalOpen}
        onClose={handleProlongModalClose}
        haltData={selectedHalt}
      />
    </>
  );
};

export default ActiveSSCBTable;
