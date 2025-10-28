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
      title={`Edit Halt: ${row.symbol}-${row.haltId}`}
      arrow
    >
      <button className="halt-action-button">Edit</button>
    </Tooltip>
    <Tooltip
      title={`Cancel Halt: ${row.symbol}-${row.haltId}`}
      arrow
    >
      <button className="halt-action-button-red">Cancel</button>
    </Tooltip>
  </>
);

export default PendingTable;