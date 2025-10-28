import HaltTable from './HaltTable';

const ActiveSSCBTable = ({ data, onHaltIdClick }) => {
  return (
    <HaltTable
      tableType="activeSSCB"
      data={data}
      showControls={false}
      showExtendedCheckbox={false}
      showActionButtons={false}
      onHaltIdClick={onHaltIdClick}
    />
  );
};

export default ActiveSSCBTable;