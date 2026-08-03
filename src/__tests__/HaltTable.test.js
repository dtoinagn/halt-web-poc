import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HaltTable from '../components/dashboard/components/HaltTable';
import { LoggedInUserContext } from '../contexts/LoggedInUserContext';

describe('HaltTable status filtering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders status labels and correctly formats cancelled status', () => {
    const rows = [
      {
        haltId: '1001',
        symbol: 'ABC',
        state: 'ACTIVE_REG_HALT',
        subState: '',
        issueName: 'Issue A',
        listingMarket: 'NSE',
        allIssue: 'Y',
        createdBy: 'tester',
        haltTime: '2024-01-01T10:00:00',
        resumptionTime: '2024-01-01T11:00:00',
        extendedHalt: false,
        remainedHalt: false,
      },
      {
        haltId: '1002',
        symbol: 'XYZ',
        state: 'PENDING_HALT',
        subState: 'Pending_Halt_Cancelled',
        issueName: 'Issue B',
        listingMarket: 'NSE',
        allIssue: 'Y',
        createdBy: 'tester',
        haltTime: '2024-01-02T10:00:00',
        resumptionTime: '2024-01-02T11:00:00',
        extendedHalt: false,
        remainedHalt: false,
      },
    ];

    render(
      <HaltTable
        tableType="activeReg"
        data={rows}
        showControls={false}
        showExtendedCheckbox={false}
        showActionButtons={false}
      />
    );

    expect(screen.getByText('ABC')).toBeTruthy();
    expect(screen.getByText('XYZ')).toBeTruthy();
    expect(screen.getByText('CANCELLED')).toBeTruthy();
  });

  it('hides the Action column for users with read-only role', () => {
    const rows = [
      {
        haltId: '1001',
        symbol: 'ABC',
        state: 'ACTIVE_REG_HALT',
        subState: '',
        issueName: 'Issue A',
        listingMarket: 'NSE',
        allIssue: 'Y',
        createdBy: 'tester',
        haltTime: '2024-01-01T10:00:00',
        resumptionTime: '2024-01-01T11:00:00',
        extendedHalt: false,
        remainedHalt: false,
      },
    ];

    render(
      <LoggedInUserContext.Provider value={{ roles: ['read'], permissions: [] }}>
        <HaltTable
          tableType="activeReg"
          data={rows}
          showControls={false}
          showExtendedCheckbox={false}
          showActionButtons={true}
          renderActionCell={() => <div>Action button</div>}
        />
      </LoggedInUserContext.Provider>
    );

    expect(screen.queryByText('Action')).toBeNull();
  });
});
