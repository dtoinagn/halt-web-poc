/**
 * Utility functions for generating and managing idempotency keys
 * for halt requests to ensure operations are processed only once.
 */

/**
 * Generates a UUID v4 using the Web Crypto API for cryptographic randomness.
 * Falls back to Math.random() if crypto API is unavailable.
 *
 * @returns {string} A UUID v4 string (e.g., "550e8400-e29b-41d4-a716-446655440000")
 */
export function generateUUID() {
  // Use crypto API if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: manual UUID v4 generation using crypto.getRandomValues
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
  }

  // Final fallback for older browsers (NOT cryptographically secure)
  console.warn('Crypto API unavailable, using Math.random() for UUID generation');
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Truncates an idempotency key for safe logging.
 * Shows first 8 characters and last 4 characters of the UUID.
 *
 * @param {string} key - The full idempotency key
 * @returns {string} Truncated key (e.g., "550e8400-...-0000")
 */
export function truncateKeyForLogging(key) {
  if (!key || key.length < 13) {
    return '***';
  }
  return `${key.substring(0, 8)}-...-${key.substring(key.length - 4)}`;
}

/**
 * Generates a unique request identifier combining action and optional haltId.
 * Used to track in-flight requests and prevent duplicates.
 *
 * @param {string} action - The halt action type (e.g., "CreateImmediateHalt")
 * @param {string} [haltId] - Optional halt ID for operations on existing halts
 * @returns {string} Request identifier
 */
export function generateRequestId(action, haltId = null) {
  return haltId ? `${action}:${haltId}` : action;
}
