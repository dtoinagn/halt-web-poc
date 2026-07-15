/**
 * JWT Token Parser Utility
 * Provides functions to decode and validate JWT tokens
 */

/**
 * Decodes a base64url encoded string to a regular string
 * @param {string} base64url - The base64url encoded string
 * @returns {string} The decoded string
 */
const decodeBase64Url = (base64url) => {
  try {
    // Convert base64url to base64
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    
    // Add padding if needed
    const padding = 4 - (base64.length % 4);
    if (padding !== 4) {
      base64 += "=".repeat(padding);
    }
    
    // Decode from base64
    const decoded = atob(base64);
    
    // Convert to UTF-8
    return decodeURIComponent(
      decoded
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
  } catch (error) {
    throw new Error(`Failed to decode base64url: ${error.message}`);
  }
};

/**
 * Parses a JWT token and returns its header, payload, and signature
 * @param {string} token - The JWT token to parse
 * @returns {Object} Object containing decoded header, payload, and signature parts
 * @throws {Error} If token is invalid or malformed
 */
export const parseJWT = (token) => {
  if (!token) {
    throw new Error("Token is required");
  }

  if (typeof token !== "string") {
    throw new Error("Token must be a string");
  }

  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Invalid JWT format. Token must have 3 parts separated by dots");
  }

  const [headerEncoded, payloadEncoded, signature] = parts;

  try {
    const header = JSON.parse(decodeBase64Url(headerEncoded));
    const payload = JSON.parse(decodeBase64Url(payloadEncoded));

    return {
      header,
      payload,
      signature,
      raw: {
        header: headerEncoded,
        payload: payloadEncoded,
        signature,
      },
    };
  } catch (error) {
    throw new Error(`Failed to parse JWT: ${error.message}`);
  }
};

/**
 * Gets the payload from a JWT token
 * @param {string} token - The JWT token
 * @returns {Object} The decoded payload
 */
export const getJWTPayload = (token) => {
  const parsed = parseJWT(token);
  return parsed.payload;
};

/**
 * Gets the header from a JWT token
 * @param {string} token - The JWT token
 * @returns {Object} The decoded header
 */
export const getJWTHeader = (token) => {
  const parsed = parseJWT(token);
  return parsed.header;
};

/**
 * Checks if a JWT token is expired
 * @param {string} token - The JWT token
 * @returns {boolean} True if token is expired, false otherwise
 */
export const isJWTExpired = (token) => {
  try {
    const payload = getJWTPayload(token);
    
    if (!payload.exp) {
      return false; // No expiration claim
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();

    return currentTime > expirationTime;
  } catch (error) {
    return true; // Consider invalid tokens as expired
  }
};

/**
 * Gets the time until a JWT token expires
 * @param {string} token - The JWT token
 * @returns {number|null} Milliseconds until expiration, or null if no expiration
 */
export const getJWTTimeUntilExpiry = (token) => {
  try {
    const payload = getJWTPayload(token);
    
    if (!payload.exp) {
      return null;
    }

    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    return timeUntilExpiry > 0 ? timeUntilExpiry : 0;
  } catch (error) {
    return null;
  }
};

/**
 * Extracts a claim from a JWT token
 * @param {string} token - The JWT token
 * @param {string} claimName - The name of the claim to extract
 * @returns {any} The claim value, or undefined if not found
 */
export const getJWTClaim = (token, claimName) => {
  try {
    const payload = getJWTPayload(token);
    return payload[claimName];
  } catch (error) {
    return undefined;
  }
};

/**
 * Validates JWT token structure and expiration
 * @param {string} token - The JWT token to validate
 * @returns {Object} Validation result with isValid boolean and error message if invalid
 */
export const validateJWT = (token) => {
  try {
    const parsed = parseJWT(token);

    if (isJWTExpired(token)) {
      return {
        isValid: false,
        error: "Token has expired",
        parsed,
      };
    }

    return {
      isValid: true,
      error: null,
      parsed,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      parsed: null,
    };
  }
};

export default {
  parseJWT,
  getJWTPayload,
  getJWTHeader,
  isJWTExpired,
  getJWTTimeUntilExpiry,
  getJWTClaim,
  validateJWT,
};
