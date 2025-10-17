import { renderHook, act, waitFor } from '@testing-library/react';
import { useSSE } from '../hooks/useSSE';
import { apiService } from '../services/api';
import { HALT_STATUSES, HALT_TYPES } from '../constants';

// Mock dependencies
jest.mock('../services/api');
jest.mock('../utils/dateUtils', () => ({
  getCurrentDateTime: jest.fn(() => '20241015-14:30:45.000'),
  formatDateTimeForDashboard: jest.fn((time) => time?.replace(/(\d{8})-/, '$1 ').replace(/\.\d{3}$/, '') || time)
}));

describe('useSSE', () => {
  let mockEventSource;
  let eventSourceInstances = [];

  const defaultProps = {
    haltList: [],
    activeRegData: [],
    activeRegHaltList: [],
    activeSSCBData: [],
    liftedData: [],
    pendingData: [],
    notExtendedList: [],
    setActiveRegData: jest.fn(),
    setActiveSSCBData: jest.fn(),
    setLiftedData: jest.fn(),
    setPendingData: jest.fn(),
    setActiveRegHaltList: jest.fn(),
    setNotExtendedList: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    eventSourceInstances = [];

    // Mock EventSource
    mockEventSource = class MockEventSource {
      constructor(url, config) {
        this.url = url;
        this.config = config;
        this.onmessage = null;
        this.onerror = null;
        eventSourceInstances.push(this);
      }
      close() { }
    };
    global.EventSource = mockEventSource;

    // Mock window.runConfig
    global.window.runConfig = {
      apiSSEstream: 'http://localhost:3001/api/sse?ticket=',
      notificationTimeout: 3000
    };

    // Mock apiService
    apiService.getSSETicket = jest.fn().mockResolvedValue({
      sseTicket: 'test-ticket-123'
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('getSSETicket', () => {
    it('should fetch and set SSE ticket', async () => {
      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      expect(apiService.getSSETicket).toHaveBeenCalled();
      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
        expect(eventSourceInstances[0].url).toBe('http://localhost:3001/api/sse?ticket=test-ticket-123');
      });
    });

    it('should handle error when fetching ticket fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      apiService.getSSETicket.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      expect(consoleError).toHaveBeenCalledWith('Failed to get SSE ticket:', expect.any(Error));
      consoleError.mockRestore();
    });
  });

  describe('SSE connection', () => {
    it('should create EventSource when ticket is set', async () => {
      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(1);
        expect(eventSourceInstances[0].url).toContain('test-ticket-123');
      });
    });

    it('should not create EventSource when apiSSEstream is not configured', async () => {
      global.window.runConfig = {};

      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => {
        expect(eventSourceInstances.length).toBe(0);
      });
    });

    it('should ignore heartbeat messages', async () => {
      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const heartbeatMessage = { data: JSON.stringify({ heartbeat: true, timestamp: Date.now() }) };

      act(() => {
        eventSourceInstances[0].onmessage(heartbeatMessage);
      });

      expect(result.current.sseMessage).toBe('');
    });
  });

  describe('notification handling', () => {
    it('should show and hide notification', async () => {
      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT001',
          symbol: 'AAPL',
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          haltTime: '20241015-09:30:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(result.current.showNotification).toBe(true);
      expect(result.current.notification).toContain('AAPL');

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.showNotification).toBe(false);
    });

    it('should hide notification manually', async () => {
      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT001',
          symbol: 'AAPL',
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          haltTime: '20241015-09:30:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(result.current.showNotification).toBe(true);

      act(() => {
        result.current.hideNotification();
      });

      expect(result.current.showNotification).toBe(false);
    });
  });

  describe('new halt handling', () => {
    it('should add new REG halt to active data', async () => {
      const setActiveRegData = jest.fn();
      const setActiveRegHaltList = jest.fn();
      const haltList = [];
      const notExtendedList = [];

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        haltList,
        notExtendedList,
        setActiveRegData,
        setActiveRegHaltList
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT001',
          symbol: 'AAPL',
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          haltTime: '20241015-09:30:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setActiveRegData).toHaveBeenCalled();
      expect(setActiveRegHaltList).toHaveBeenCalled();
      expect(haltList).toContain('HALT001');
      expect(notExtendedList).toContain('HALT001');
    });

    it('should add new SSCB halt to active SSCB data', async () => {
      const setActiveSSCBData = jest.fn();

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        setActiveSSCBData
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT002',
          symbol: 'TSLA',
          status: HALT_STATUSES.RESUMPTION_PENDING,
          haltType: HALT_TYPES.SSCB,
          haltTime: '20241015-10:00:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setActiveSSCBData).toHaveBeenCalled();
    });

    it('should add pending halt to pending data', async () => {
      const setPendingData = jest.fn();

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        setPendingData
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT003',
          symbol: 'GOOGL',
          status: HALT_STATUSES.HALT_PENDING,
          haltType: HALT_TYPES.REG,
          haltTime: '20241015-11:00:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setPendingData).toHaveBeenCalled();
    });
  });

  describe('existing halt updates', () => {
    it('should update extended status for existing halt', async () => {
      const setNotExtendedList = jest.fn();
      const setActiveRegData = jest.fn();

      const existingHalt = {
        haltId: 'HALT001',
        symbol: 'AAPL',
        status: HALT_STATUSES.HALTED,
        haltType: HALT_TYPES.REG,
        extendedHalt: false
      };

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        haltList: ['HALT001'],
        activeRegData: [existingHalt],
        activeRegHaltList: ['HALT001'],
        setNotExtendedList,
        setActiveRegData
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT001',
          symbol: 'AAPL',
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          extendedHalt: true
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setNotExtendedList).toHaveBeenCalled();
      expect(setActiveRegData).toHaveBeenCalled();
    });

    it('should move REG halt from active to lifted when resumed', async () => {
      const setActiveRegData = jest.fn();
      const setLiftedData = jest.fn();
      const setActiveRegHaltList = jest.fn();

      const existingHalt = {
        haltId: 'HALT001',
        symbol: 'AAPL',
        status: HALT_STATUSES.HALTED,
        haltType: HALT_TYPES.REG
      };

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        haltList: ['HALT001'],
        activeRegData: [existingHalt],
        activeRegHaltList: ['HALT001'],
        liftedData: [],
        setActiveRegData,
        setLiftedData,
        setActiveRegHaltList
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT001',
          symbol: 'AAPL',
          status: HALT_STATUSES.RESUMED,
          haltType: HALT_TYPES.REG,
          resumptionTime: '20241015-10:00:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setActiveRegData).toHaveBeenCalled();
      expect(setLiftedData).toHaveBeenCalled();
      expect(setActiveRegHaltList).toHaveBeenCalled();
    });

    it('should move SSCB halt from active to lifted when resumed', async () => {
      const setActiveSSCBData = jest.fn();
      const setLiftedData = jest.fn();

      const existingHalt = {
        haltId: 'HALT002',
        symbol: 'TSLA',
        status: HALT_STATUSES.RESUMPTION_PENDING,
        haltType: HALT_TYPES.SSCB
      };

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        haltList: ['HALT002'],
        activeSSCBData: [existingHalt],
        liftedData: [],
        setActiveSSCBData,
        setLiftedData
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT002',
          symbol: 'TSLA',
          status: HALT_STATUSES.RESUMED,
          haltType: HALT_TYPES.SSCB,
          resumptionTime: '20241015-11:00:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setActiveSSCBData).toHaveBeenCalled();
      expect(setLiftedData).toHaveBeenCalled();
    });

    it('should update active halt when resumption time is set', async () => {
      const setActiveRegData = jest.fn();

      const existingHalt = {
        haltId: 'HALT001',
        symbol: 'AAPL',
        status: HALT_STATUSES.HALTED,
        haltType: HALT_TYPES.REG
      };

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        haltList: ['HALT001'],
        activeRegData: [existingHalt],
        activeRegHaltList: ['HALT001'],
        setActiveRegData
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT001',
          symbol: 'AAPL',
          status: HALT_STATUSES.RESUMPTION_PENDING,
          haltType: HALT_TYPES.REG,
          resumptionTime: '20241015-10:30:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setActiveRegData).toHaveBeenCalled();
    });

    it('should move pending halt to active when activated', async () => {
      const setPendingData = jest.fn();
      const setActiveRegData = jest.fn();
      const setNotExtendedList = jest.fn();

      const pendingHalt = {
        haltId: 'HALT003',
        symbol: 'GOOGL',
        status: HALT_STATUSES.HALT_PENDING,
        haltType: HALT_TYPES.REG
      };

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        haltList: ['HALT003'],
        pendingData: [pendingHalt],
        activeRegData: [],
        setPendingData,
        setActiveRegData,
        setNotExtendedList
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const message = {
        data: JSON.stringify({
          haltId: 'HALT003',
          symbol: 'GOOGL',
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          haltTime: '20241015-11:00:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setPendingData).toHaveBeenCalled();
      expect(setActiveRegData).toHaveBeenCalled();
    });

    it('should update existing active halt without duplicating when receiving SSE event', async () => {
      const setActiveRegData = jest.fn();

      const existingActiveHalt = {
        haltId: 'HALT004',
        symbol: 'MSFT',
        status: HALT_STATUSES.HALTED,
        haltType: HALT_TYPES.REG,
        haltTime: '20241015-09:00:00.000',
        resumptionTime: null
      };

      const { result } = renderHook(() => useSSE({
        ...defaultProps,
        haltList: ['HALT004'],
        activeRegData: [existingActiveHalt],
        activeRegHaltList: ['HALT004'],
        setActiveRegData
      }));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      // Simulate receiving an SSE event for the same halt with updated data
      const message = {
        data: JSON.stringify({
          haltId: 'HALT004',
          symbol: 'MSFT',
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          haltTime: '20241015-09:00:00.000',
          resumptionTime: '20241015-10:00:00.000'
        })
      };

      act(() => {
        eventSourceInstances[0].onmessage(message);
      });

      expect(setActiveRegData).toHaveBeenCalled();

      // Verify that the update doesn't duplicate - should still have only 1 halt
      const updatedData = setActiveRegData.mock.calls[0][0];
      expect(updatedData.length).toBe(1);
      expect(updatedData[0].haltId).toBe('HALT004');
    });
  });

  describe("scheduled halt to triggered halt with extension tracking", () => {
    it("should correctly update notExtendedList when scheduled halt becomes triggered then extended", async () => {
      const setActiveRegData = jest.fn();
      const setActiveRegHaltList = jest.fn();
      const setPendingData = jest.fn();
      const setNotExtendedList = jest.fn();

      const haltList = [];
      const notExtendedList = [];
      const activeRegHaltList = [];
      const pendingData = [];
      const activeRegData = [];

      const { result, rerender } = renderHook(
        ({
          haltList,
          notExtendedList,
          activeRegHaltList,
          pendingData,
          activeRegData,
        }) =>
          useSSE({
            ...defaultProps,
            haltList,
            notExtendedList,
            activeRegHaltList,
            pendingData,
            activeRegData,
            setActiveRegData,
            setActiveRegHaltList,
            setPendingData,
            setNotExtendedList,
          }),
        {
          initialProps: {
            haltList,
            notExtendedList,
            activeRegHaltList,
            pendingData,
            activeRegData,
          },
        }
      );

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      // Step 1: Halt is scheduled (HALT_SCHEDULED)
      const scheduledMessage = {
        data: JSON.stringify({
          haltId: "HALT005",
          symbol: "NFLX",
          status: HALT_STATUSES.HALT_SCHEDULED,
          haltType: HALT_TYPES.REG,
          haltTime: "20241015-14:00:00.000",
        }),
      };

      act(() => {
        eventSourceInstances[0].onmessage(scheduledMessage);
      });

      expect(setPendingData).toHaveBeenCalled();
      expect(haltList).toContain("HALT005");
      // At this point: activeRegHaltList = [], notExtendedList = []
      // Label calculation: 0 - 0 = 0

      // Update state to simulate pending halt
      haltList.push("HALT005");
      pendingData.push({
        haltId: "HALT005",
        symbol: "NFLX",
        status: HALT_STATUSES.HALT_SCHEDULED,
        haltType: HALT_TYPES.REG,
        haltTime: "20241015-14:00:00.000",
      });

      rerender({
        haltList,
        notExtendedList,
        activeRegHaltList,
        pendingData,
        activeRegData,
      });

      // Step 2: Halt is triggered by backend scheduler (status becomes HALTED)
      const triggeredMessage = {
        data: JSON.stringify({
          haltId: "HALT005",
          symbol: "NFLX",
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          haltTime: "20241015-14:00:00.000",
          extendedHalt: false,
        }),
      };

      act(() => {
        eventSourceInstances[0].onmessage(triggeredMessage);
      });

      expect(setPendingData).toHaveBeenCalledTimes(2); // Removes from pending
      expect(setActiveRegData).toHaveBeenCalled(); // Adds to active
      expect(setNotExtendedList).toHaveBeenCalled(); // Should add HALT005 to notExtendedList

      // Simulate state update after triggered
      activeRegData.push({
        haltId: "HALT005",
        symbol: "NFLX",
        status: HALT_STATUSES.HALTED,
        haltType: HALT_TYPES.REG,
        haltTime: "20241015-14:00:00.000",
        extendedHalt: false,
      });
      activeRegHaltList.push("HALT005");
      notExtendedList.push("HALT005");
      pendingData.length = 0;

      rerender({
        haltList,
        notExtendedList,
        activeRegHaltList,
        pendingData,
        activeRegData,
      });

      // At this point: activeRegHaltList.length = 1, notExtendedList.length = 1
      // Label calculation: 1 - 1 = 0 extended halts (correct, halt is not extended)

      // Step 3: User extends the halt
      jest.clearAllMocks();
      const extendedMessage = {
        data: JSON.stringify({
          haltId: "HALT005",
          symbol: "NFLX",
          status: HALT_STATUSES.HALTED,
          haltType: HALT_TYPES.REG,
          haltTime: "20241015-14:00:00.000",
          extendedHalt: true, // Changed from false to true
        }),
      };

      act(() => {
        eventSourceInstances[0].onmessage(extendedMessage);
      });

      // BUG CHECK: setNotExtendedList should be called to remove HALT005 from notExtendedList
      expect(setNotExtendedList).toHaveBeenCalled();

      // Verify that HALT005 was removed from notExtendedList
      const notExtendedListUpdates = setNotExtendedList.mock.calls;
      const lastUpdate =
        notExtendedListUpdates[notExtendedListUpdates.length - 1][0];
      expect(lastUpdate).not.toContain("HALT005");

      // Expected: activeRegHaltList.length = 1, notExtendedList.length = 0
      // Label calculation should be: 1 - 0 = 1 extended halt (correct)
    });
  });

  describe('cleanup', () => {
    it('should close EventSource on unmount', async () => {
      const { result, unmount } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const closeSpy = jest.spyOn(eventSourceInstances[0], 'close');

      unmount();

      expect(closeSpy).toHaveBeenCalled();
    });

    it('should handle SSE error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const { result } = renderHook(() => useSSE(defaultProps));

      await act(async () => {
        await result.current.getSSETicket();
      });

      await waitFor(() => expect(eventSourceInstances.length).toBe(1));

      const closeSpy = jest.spyOn(eventSourceInstances[0], 'close');

      act(() => {
        eventSourceInstances[0].onerror(new Error('Connection failed'));
      });

      expect(consoleError).toHaveBeenCalledWith('SSE error:', expect.any(Error));
      expect(closeSpy).toHaveBeenCalled();
      consoleError.mockRestore();
    });
  });
});
