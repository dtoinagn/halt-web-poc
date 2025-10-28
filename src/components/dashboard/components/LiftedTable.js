import HaltTable from './HaltTable';

const LiftedTable = ({ data, onHaltIdClick }) => {
  return (
    <HaltTable
      tableType="lifted"
      data={data}
      showControls={false}
      showExtendedCheckbox={false}
      showActionButtons={false}
      onHaltIdClick={onHaltIdClick}
    />
  );
};

export default LiftedTable;