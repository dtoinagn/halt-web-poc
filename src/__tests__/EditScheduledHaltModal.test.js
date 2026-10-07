import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import EditScheduledHaltModal from '../components/dashboard/components/EditScheduledHaltModal';
import { HALT_ACTIONS, HALT_STATES } from '../constants';

dayjs.extend(utc);
dayjs.extend(timezone);

const mockUpdateHalt = jest.fn();

jest.mock('../services/api', () => ({
  apiService: {
    updateHalt: (...args) => mockUpdateHalt(...args),
  },
}));

jest.mock('../utils/storageUtils', () => ({
  authUtils: {
    getLoggedInUser: () => 'test-user',
  },
}));

jest.mock('../components/dashboard/components/HaltReasonSelector', () => ({
  __esModule: true,
  default: ({ disabled }) => (
    <div
      data-testid="halt-reason-selector"
      data-disabled={disabled ? 'true' : 'false'}
    />
  ),
}));

describe('EditScheduledHaltModal', () => {
  const validHaltTime = dayjs().tz('America/New_York').startOf('day').add(12, 'hour').format('YYYY-MM-DDTHH:mm');

  beforeEach(() => {
    mockUpdateHalt.mockReset();
    mockUpdateHalt.mockResolvedValue({});
  });

  it('uses the action passed from the pending action button when submitting', async () => {
    const onClose = jest.fn();

    render(
      <EditScheduledHaltModal
        open
        onClose={onClose}
        action={HALT_ACTIONS.SUBMIT_HALT_DRAFT}
        haltData={{
          haltId: '123',
          symbol: 'AAPL',
          issueName: 'Apple Inc',
          listingMarket: 'NASDAQ',
          allIssue: 'No',
          haltTime: validHaltTime,
          resumptionTime: validHaltTime,
          extendedHalt: false,
          haltReasonDescription: 'Test Reason',
          haltReasonCode: 'TR',
          haltReasonType: 'TR',
          remainedHalt: false,
          remainReason: '',
          state: HALT_STATES.DRAFT_REG_HALT,
          haltType: 'REG',
          createdBy: 'tester',
          createdTime: validHaltTime,
          responseMessage: '',
          sscbSource: '',
        }}
        haltReasons={[{ reasonDescription: 'Test Reason', reasonCode: 'TR', reasonTypeCode: 'TR' }]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(mockUpdateHalt).toHaveBeenCalledWith(
        expect.objectContaining({ action: HALT_ACTIONS.SUBMIT_HALT_DRAFT })
      );
    });
  });

  it('renders read-only fields when action is SUBMIT_HALT_DRAFT', () => {
    render(
      <EditScheduledHaltModal
        open
        onClose={jest.fn()}
        action={HALT_ACTIONS.SUBMIT_HALT_DRAFT}
        haltData={{
          haltId: '123',
          symbol: 'AAPL',
          issueName: 'Apple Inc',
          listingMarket: 'NASDAQ',
          allIssue: 'No',
          haltTime: '2099-08-01T10:00:00',
          resumptionTime: '2099-08-01T11:00:00',
          extendedHalt: false,
          haltReasonDescription: 'Test Reason',
          haltReasonCode: 'TR',
          haltReasonType: 'TR',
          remainedHalt: false,
          remainReason: '',
          state: HALT_STATES.DRAFT_REG_HALT,
          haltType: 'REG',
          createdBy: 'tester',
          createdTime: '2099-08-01T09:00:00',
          responseMessage: '',
          sscbSource: '',
        }}
        haltReasons={[{ reasonDescription: 'Test Reason', reasonCode: 'TR', reasonTypeCode: 'TR' }]}
      />
    );

    expect(screen.getByTestId('halt-time-input').disabled).toBe(true);
    expect(screen.getByTestId('all-issue-select').disabled).toBe(true);
    expect(screen.getByTestId('halt-reason-selector').getAttribute('data-disabled')).toBe('true');
  });
});
