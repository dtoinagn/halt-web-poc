import {
  generateUUID,
  truncateKeyForLogging,
  generateRequestId,
} from "../utils/idempotencyUtils";

describe("idempotencyUtils", () => {
  describe("generateUUID", () => {
    it("should generate a valid UUID v4", () => {
      const uuid = generateUUID();

      // UUID v4 regex pattern
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });

    it("should generate unique UUIDs", () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      const uuid3 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    it("should generate UUID with correct length", () => {
      const uuid = generateUUID();

      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters including hyphens)
      expect(uuid).toHaveLength(36);
    });

    it("should generate UUID with correct version (4)", () => {
      const uuid = generateUUID();

      // 15th character should be '4' for UUID v4
      expect(uuid.charAt(14)).toBe('4');
    });

    it("should generate UUID with correct variant", () => {
      const uuid = generateUUID();

      // 20th character should be 8, 9, a, or b for RFC 4122 variant
      const variantChar = uuid.charAt(19).toLowerCase();
      expect(['8', '9', 'a', 'b']).toContain(variantChar);
    });
  });

  describe("truncateKeyForLogging", () => {
    it("should truncate UUID for safe logging", () => {
      const fullKey = "550e8400-e29b-41d4-a716-446655440000";
      const truncated = truncateKeyForLogging(fullKey);

      expect(truncated).toBe("550e8400-...-0000");
    });

    it("should handle short keys", () => {
      const shortKey = "abc123";
      const truncated = truncateKeyForLogging(shortKey);

      expect(truncated).toBe("***");
    });

    it("should handle null or undefined keys", () => {
      expect(truncateKeyForLogging(null)).toBe("***");
      expect(truncateKeyForLogging(undefined)).toBe("***");
      expect(truncateKeyForLogging("")).toBe("***");
    });

    it("should show first 8 chars and last 4 chars for valid UUID", () => {
      const uuid = "123456789-abcd-4xyz-8abc-def123456789";
      const truncated = truncateKeyForLogging(uuid);

      expect(truncated).toMatch(/^12345678-\.\.\.-6789$/);
    });
  });

  describe("generateRequestId", () => {
    it("should generate request ID with action only", () => {
      const requestId = generateRequestId("CreateImmediateHalt");

      expect(requestId).toBe("CreateImmediateHalt");
    });

    it("should generate request ID with action and haltId", () => {
      const requestId = generateRequestId("ModifyScheduledHalt", "HALT123");

      expect(requestId).toBe("ModifyScheduledHalt:HALT123");
    });

    it("should handle null haltId", () => {
      const requestId = generateRequestId("CreateImmediateHalt", null);

      expect(requestId).toBe("CreateImmediateHalt");
    });

    it("should generate different IDs for different halt actions on same halt", () => {
      const requestId1 = generateRequestId("ModifyScheduledHalt", "HALT123");
      const requestId2 = generateRequestId("CancelScheduledHalt", "HALT123");

      expect(requestId1).not.toBe(requestId2);
      expect(requestId1).toBe("ModifyScheduledHalt:HALT123");
      expect(requestId2).toBe("CancelScheduledHalt:HALT123");
    });

    it("should generate same ID for same action and haltId", () => {
      const requestId1 = generateRequestId("ModifyScheduledHalt", "HALT123");
      const requestId2 = generateRequestId("ModifyScheduledHalt", "HALT123");

      expect(requestId1).toBe(requestId2);
    });
  });
});
