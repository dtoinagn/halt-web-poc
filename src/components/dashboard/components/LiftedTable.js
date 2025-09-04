import React from 'react';
import HaltTable from './HaltTable';

const LiftedTable = ({ data }) => {
  return (
    <HaltTable
      tableType="lifted"
      data={data}
      showControls={false}
      showExtendedCheckbox={false}
      showActionButtons={false}
    />
  );
};

export default LiftedTable;