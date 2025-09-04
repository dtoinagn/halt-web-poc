import React from 'react';
import HaltTable from './HaltTable';

const ActiveRegTable = ({ 
  data, 
  activeRegHaltList, 
  notExtendedList, 
  onExtendedHaltUpdate 
}) => {
  return (
    <HaltTable
      tableType="activeReg"
      data={data}
      activeRegHaltList={activeRegHaltList}
      notExtendedList={notExtendedList}
      onExtendedHaltUpdate={onExtendedHaltUpdate}
      showControls={true}
      showExtendedCheckbox={true}
      showActionButtons={true}
    />
  );
};

export default ActiveRegTable;