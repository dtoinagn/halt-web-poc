import { useState } from "react";
import HaltTable from "./HaltTable";
import ProlongSSCBHaltModal from "./ProlongSSCBHaltModal";
import ConvertSSCBHaltModal from "./ConvertSSCBHaltModal";

const ActiveSSCBTable = ({ data, onHaltIdClick, haltReasons = [], onHaltUpdated,}) => {
  const [prolongSSCBHaltModalOpen, setProlongSSCBHaltModalOpen] =
    useState(false);
  const [convertSSCBHaltModalOpen, setConvertSSCBHaltModalOpen] =
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

  const handleConvertHalt = (row) => {
    setSelectedHalt(row);
    setConvertSSCBHaltModalOpen(true);
  };

  const handleConvertModalClose = () => {
    setConvertSSCBHaltModalOpen(false);
    setSelectedHalt(null);
  };

  const renderSSCBAction = (row) => (
    <>
      {row.sscbExtended ? null :
          <button
            className="halt-action-button"
            onClick={() => handleProlongHalt(row)}
            style={{ marginLeft: 0 }}
          >
          Prolong SSCB 5 Min
        </button> }
          <button
            className="halt-action-button"
            onClick={() => handleConvertHalt(row)}
            style={{ marginLeft: 0 }}
          >
            Convert to Regulatory
          </button>
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
      <ConvertSSCBHaltModal
        open={convertSSCBHaltModalOpen}
        onClose={handleConvertModalClose}
        haltData={selectedHalt}
        haltReasons={haltReasons}
        onHaltUpdated={onHaltUpdated}
      />
    </>
  );
};

export default ActiveSSCBTable;
