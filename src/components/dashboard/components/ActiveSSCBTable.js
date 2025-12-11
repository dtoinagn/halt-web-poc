import { useState } from "react";
import HaltTable from "./HaltTable";
import { Tooltip } from "@mui/material";

const ActiveSSCBTable = ({ data, onHaltIdClick }) => {
  const [prolongSSCBHaltModalOpen, setProlongSSCBHaltModalOpen] =
    useState(false);
  const [selectedHalt, setSelectedHalt] = useState(null);

  const handleProlongHalt = (row) => {
    setSelectedHalt(row);
    //setProlongSSCBHaltModalOpen(true);
  };

  const handleProlongModalClose = () => {
    //setProlongSSCBHaltModalOpen(false);
    setSelectedHalt(null);
  };

  const renderSSCBAction = (row) => (
    <>
      <Tooltip title={`Prolong SSCB: ${row.haltId}`} arrow>
        <button
          className="halt-action-button"
          onClick={() => handleProlongHalt(row)}
        >
          Prolong SSCB 5 Min
        </button>
      </Tooltip>
      {row.resumptionTime ? (
        <Tooltip title={`Convert: ${row.haltId}`} arrow>
          <button className="halt-action-button">Convert to Regulatory</button>
        </Tooltip>
      ) : null}
    </>
  );

  return (
    <HaltTable
      tableType="activeSSCB"
      data={data}
      showControls={false}
      showExtendedCheckbox={false}
      showActionButtons={false}
      renderActionCell={renderSSCBAction}
      onHaltIdClick={onHaltIdClick}
    />
  );
};

export default ActiveSSCBTable;
