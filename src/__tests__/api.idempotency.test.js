import { apiService } from "../services/api";
import * as idempotencyUtils from "../utils/idempotencyUtils";

// Mock fetch
global.fetch = jest.fn();

// Mock window.runConfig
global.window = {
  runConfig: {
    apiNewHalt: "http://localhost:8081/api/halt/create",
    apiHaltUpdate: "http://localhost:8081/api/halt/update",
    apiResumption: "http://localhost:8081/api/halt/update",
  },
};

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

describe("API Service - Idempotency", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    fetch.mockClear();
    mockLocalStorage.clear();
    mockLocalStorage.setItem("token", "test-token-123");

    // Clear in-flight requests
    apiService.inFlightRequests.clear();

    // Mock console methods to avoid cluttering test output
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe("Idempotency Key Generation", () => {
    it("should generate and include idempotency key in request headers", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      jest.spyOn(idempotencyUtils, "generateUUID").mockReturnValue(mockUUID);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
        haltReason: "T1",
      };

      await apiService.createNewHalt(payload);

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, options] = fetch.mock.calls[0];

      expect(options.headers["Idempotency-Key"]).toBe(mockUUID);
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(options.headers["Authorization"]).toBe("Bearer test-token-123");
    });

    it("should generate unique idempotency keys for different requests", async () => {
      const mockUUIDs = [
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];
      let uuidIndex = 0;
      jest
        .spyOn(idempotencyUtils, "generateUUID")
        .mockImplementation(() => mockUUIDs[uuidIndex++]);

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const payload1 = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };
      const payload2 = {
        action: "CreateImmediateHalt",
        symbol: "GOOGL",
      };

      await apiService.createNewHalt(payload1);
      await apiService.createNewHalt(payload2);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(mockUUIDs[0]);
      expect(fetch.mock.calls[1][1].headers["Idempotency-Key"]).toBe(mockUUIDs[1]);
    });
  });

  describe("Duplicate Request Prevention", () => {
    it("should prevent duplicate requests for the same action", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      jest.spyOn(idempotencyUtils, "generateUUID").mockReturnValue(mockUUID);

      let resolveRequest;
      const delayedPromise = new Promise((resolve) => {
        resolveRequest = resolve;
      });

      fetch.mockReturnValue(delayedPromise);

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      // Start two requests simultaneously
      const request1 = apiService.createNewHalt(payload);
      const request2 = apiService.createNewHalt(payload);

      // Only one fetch call should be made
      expect(fetch).toHaveBeenCalledTimes(1);

      // Resolve the request
      resolveRequest({
        ok: true,
        json: async () => ({ success: true }),
      });

      const [result1, result2] = await Promise.all([request1, request2]);

      expect(result1).toEqual({ success: true });
      expect(result2).toEqual({ success: true });
      expect(result1).toBe(result2); // Should be the same promise result
    });

    it("should allow new request after previous request completes", async () => {
      const mockUUIDs = [
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];
      let uuidIndex = 0;
      jest
        .spyOn(idempotencyUtils, "generateUUID")
        .mockImplementation(() => mockUUIDs[uuidIndex++]);

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      // First request
      await apiService.createNewHalt(payload);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(mockUUIDs[0]);

      // Second request after first completes
      await apiService.createNewHalt(payload);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch.mock.calls[1][1].headers["Idempotency-Key"]).toBe(mockUUIDs[1]);
    });

    it("should differentiate requests by action and haltId", async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const payload1 = {
        action: "ModifyScheduledHalt",
        haltId: "HALT123",
        symbol: "AAPL",
      };
      const payload2 = {
        action: "CancelScheduledHalt",
        haltId: "HALT123",
        symbol: "AAPL",
      };

      // These should be treated as different requests
      await Promise.all([
        apiService.updateHalt(payload1),
        apiService.updateHalt(payload2),
      ]);

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("Retry Logic with Key Reuse", () => {
    it("should retry on network failure with the same idempotency key", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      jest.spyOn(idempotencyUtils, "generateUUID").mockReturnValue(mockUUID);

      // Mock sleep to avoid actual delays in tests
      jest.spyOn(apiService, "_sleep").mockResolvedValue();

      // First attempt fails, second succeeds
      fetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      const result = await apiService.createNewHalt(payload);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });

      // Both attempts should use the same idempotency key
      expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(mockUUID);
      expect(fetch.mock.calls[1][1].headers["Idempotency-Key"]).toBe(mockUUID);
    });

    it("should not retry on HTTP error responses", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      jest.spyOn(idempotencyUtils, "generateUUID").mockReturnValue(mockUUID);

      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Bad Request",
          message: "Invalid payload",
        }),
      });

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      await expect(apiService.createNewHalt(payload)).rejects.toThrow();

      // Should not retry on HTTP errors
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it("should use exponential backoff for retries", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      jest.spyOn(idempotencyUtils, "generateUUID").mockReturnValue(mockUUID);

      const sleepSpy = jest.spyOn(apiService, "_sleep").mockResolvedValue();

      // Fail twice, then succeed
      fetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      await apiService.createNewHalt(payload);

      expect(fetch).toHaveBeenCalledTimes(3);
      expect(sleepSpy).toHaveBeenCalledTimes(2);

      // Check exponential backoff: 1000ms * 2^0 = 1000ms, 1000ms * 2^1 = 2000ms
      expect(sleepSpy.mock.calls[0][0]).toBe(1000);
      expect(sleepSpy.mock.calls[1][0]).toBe(2000);
    });

    it("should fail after max retries exhausted", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      jest.spyOn(idempotencyUtils, "generateUUID").mockReturnValue(mockUUID);
      jest.spyOn(apiService, "_sleep").mockResolvedValue();

      // All attempts fail
      fetch.mockRejectedValue(new Error("Network error"));

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      await expect(apiService.createNewHalt(payload)).rejects.toThrow("Network error");

      // Default maxRetries is 2, so total attempts = 3 (initial + 2 retries)
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe("Request Cleanup", () => {
    it("should clean up in-flight request tracking after completion", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      expect(apiService.inFlightRequests.size).toBe(0);

      await apiService.createNewHalt(payload);

      // After completion, in-flight tracking should be cleared
      expect(apiService.inFlightRequests.size).toBe(0);
    });

    it("should clean up in-flight request tracking even on error", async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Internal Server Error",
        }),
      });

      const payload = {
        action: "CreateImmediateHalt",
        symbol: "AAPL",
      };

      expect(apiService.inFlightRequests.size).toBe(0);

      try {
        await apiService.createNewHalt(payload);
      } catch (error) {
        // Expected to fail
      }

      // After error, in-flight tracking should be cleared
      expect(apiService.inFlightRequests.size).toBe(0);
    });
  });

  describe("Integration Tests", () => {
    it("should handle multiple concurrent different halt operations", async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const payloads = [
        { action: "CreateImmediateHalt", symbol: "AAPL" },
        { action: "CreateImmediateHalt", symbol: "GOOGL" },
        { action: "ModifyScheduledHalt", haltId: "HALT123", symbol: "MSFT" },
      ];

      await Promise.all([
        apiService.createNewHalt(payloads[0]),
        apiService.createNewHalt(payloads[1]),
        apiService.updateHalt(payloads[2]),
      ]);

      // All three should trigger separate fetch calls
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it("should work correctly with updateResumption endpoint", async () => {
      const mockUUID = "550e8400-e29b-41d4-a716-446655440000";
      jest.spyOn(idempotencyUtils, "generateUUID").mockReturnValue(mockUUID);

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const payload = {
        action: "CreateImmediateResumption",
        haltId: "HALT123",
        symbol: "AAPL",
      };

      await apiService.updateResumption(payload);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe(mockUUID);
    });
  });
});
