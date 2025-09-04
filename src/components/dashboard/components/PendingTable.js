import React from 'react';
import HaltTable from './HaltTable';

const PendingTable = ({ data }) => {
  return (
    <HaltTable
      tableType="pending"
      data={data}
      showControls={false}
      showExtendedCheckbox={false}
      showActionButtons={false}
    />
  );
};

export default PendingTable;