import React from 'react';
import HaltTable from './HaltTable';

const ActiveSSCBTable = ({ data }) => {
  return (
    <HaltTable
      tableType="activeSSCB"
      data={data}
      showControls={false}
      showExtendedCheckbox={false}
      showActionButtons={false}
    />
  );
};

export default ActiveSSCBTable;