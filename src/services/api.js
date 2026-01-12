// API service layer for centralized API calls
import { authUtils } from '../utils/storageUtils';
import { ROUTE_PATHS } from '../constants';
import {
  generateUUID,
  truncateKeyForLogging,
  generateRequestId
} from '../utils/idempotencyUtils';

class ApiService {
  constructor() {
    this.config = window.runConfig || {};
    // Track in-flight halt requests to prevent duplicates
    // Key: requestId (action + haltId), Value: { idempotencyKey, promise }
    this.inFlightRequests = new Map();
  }

  // logout helper import to clear auth state and redirect on 401
  // Note: import here to avoid circular imports in other modules
  // (storageUtils doesn't depend on apiService)
  

  getAuthHeader() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Gets authentication headers with an idempotency key.
   * @param {string} idempotencyKey - The idempotency key to include
   * @returns {Object} Headers object with auth and idempotency key
   */
  getAuthHeaderWithIdempotency(idempotencyKey) {
    return {
      ...this.getAuthHeader(),
      "Idempotency-Key": idempotencyKey,
    };
  }

  /**
   * Executes a halt request with idempotency key and duplicate request prevention.
   * If the same request is already in-flight, returns the existing promise.
   * Automatically retries on network failures with the same idempotency key.
   *
   * @param {string} url - The API endpoint URL
   * @param {Object} payload - The request payload
   * @param {Object} options - Additional options
   * @param {number} [options.maxRetries=2] - Maximum number of retries for network failures
   * @param {number} [options.retryDelay=1000] - Base delay between retries in ms
   * @returns {Promise} The request promise
   */
  async executeHaltRequest(url, payload, { maxRetries = 2, retryDelay = 1000 } = {}) {
    // Generate request ID from action, haltId, and symbol
    // This ensures different halt operations are not incorrectly deduplicated
    const requestId = generateRequestId(
      payload.action,
      payload.haltId || payload.symbol || 'unknown'
    );

    // Check if this request is already in-flight
    const existingRequest = this.inFlightRequests.get(requestId);
    if (existingRequest) {
      console.log(
        `[Idempotency] Duplicate request detected for ${requestId}, ` +
        `reusing in-flight request with key: ${truncateKeyForLogging(existingRequest.idempotencyKey)}`
      );
      return existingRequest.promise;
    }

    // Generate new idempotency key for this request
    const idempotencyKey = generateUUID();

    // Create the request promise with retry logic
    const requestPromise = this._executeWithRetry(
      url,
      payload,
      idempotencyKey,
      maxRetries,
      retryDelay
    ).finally(() => {
      // Clean up the in-flight request tracking when done
      this.inFlightRequests.delete(requestId);
    });

    // Store the in-flight request
    this.inFlightRequests.set(requestId, {
      idempotencyKey,
      promise: requestPromise
    });

    return requestPromise;
  }

  /**
   * Internal method to execute a request with retry logic.
   * Retries only on network failures, not on HTTP error responses.
   *
   * @private
   * @param {string} url - The API endpoint URL
   * @param {Object} payload - The request payload
   * @param {string} idempotencyKey - The idempotency key to use (same across retries)
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay between retries in ms
   * @returns {Promise} The request promise
   */
  async _executeWithRetry(url, payload, idempotencyKey, maxRetries, baseDelay) {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: this.getAuthHeaderWithIdempotency(idempotencyKey),
          body: JSON.stringify(payload),
        });

        // Handle response (includes 401 and other HTTP errors)
        return await this.handleResponse(response);

      } catch (error) {
        lastError = error;

        // Don't retry on authorization errors or other HTTP errors
        if (error.message === 'Unauthorized' || error.isHttpError) {
          throw error;
        }

        // Only retry network failures (fetch errors)
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(
            `[Idempotency] Network error on attempt ${attempt + 1}, ` +
            `retrying in ${delay}ms with same key: ${truncateKeyForLogging(idempotencyKey)}`
          );
          await this._sleep(delay);
        }
      }
    }

    // All retries exhausted
    console.error(
      `[Idempotency] Request failed after ${maxRetries + 1} attempts with key: ` +
      `${truncateKeyForLogging(idempotencyKey)}`
    );
    throw lastError;
  }

  /**
   * Sleep utility for retry delays.
   * @private
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after the delay
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async handleResponse(response) {
    // If the server indicates the user is unauthorized, clear auth and redirect to login
    if (response && response.status === 401) {
      try {
        // mark an auth error message so the login page can show it after redirect
        try { localStorage.setItem('authErrorMessage', 'Session expired, please login again.'); } catch (e) {}
        authUtils.logout();
      } catch (e) {
        // ignore
      }
      try {
        window.location.href = ROUTE_PATHS.LOGIN;
      } catch (e) {
        // ignore
      }
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        errorData = this.parseApiError(errorData);
      } catch (jsonError) {
        try {
          const errorText = await response.text();
          // If we have valid JSON text, try to parse it manually
          if (errorText.trim().startsWith("{")) {
            try {
              errorData = JSON.parse(errorText);
            } catch (manualParseError) {
              // Use text as fallback
              const error = new Error(`Error ${response.status}: ${errorText}`);
              error.isHttpError = true;
              throw error;
            }
          } else {
            const error = new Error(`Error ${response.status}: ${errorText}`);
            error.isHttpError = true;
            throw error;
          }
        } catch (textError) {
          // If textError already has isHttpError, re-throw it
          if (textError.isHttpError) {
            throw textError;
          }
          const error = new Error(
            `Error ${response.status}: Unable to parse error response`
          );
          error.isHttpError = true;
          throw error;
        }
      }

      // If we have errorData, create a proper error with response attached
      const error = new Error(`Error ${response.error || response.status}`);
      error.message = errorData;
      error.isHttpError = true;
      throw error;
    }
    return response.json();
  }

  // Authentication
  async login(credentials) {
    const response = await fetch(this.config.apiUserLogIn, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    return response.json();
  }

  // Halt data
  async fetchActiveHalts() {
    const response = await fetch(this.config.apiRetrieveData, {
      method: "GET",
      headers: this.getAuthHeader(),
    });
    return this.handleResponse(response);
  }

  async fetchSecurities() {
    const response = await fetch(this.config.apiFetchSecurities, {
      method: "GET",
      headers: this.getAuthHeader(),
    });
    return this.handleResponse(response);
  }

  async fetchHaltReasons() {
    const response = await fetch(this.config.apiFetchHaltReasons, {
      method: "GET",
      headers: this.getAuthHeader(),
    });
    return this.handleResponse(response);
  }

  async fetchHaltRemainReasons() {
    const response = await fetch(this.config.apiFetchHaltRemainReasons, {
      method: "GET",
      headers: this.getAuthHeader(),
    });
    return this.handleResponse(response);
  }

  async updateHalt(payload) {
    return this.executeHaltRequest(this.config.apiHaltUpdate, payload);
  }

  async createNewHalt(payload) {
    return this.executeHaltRequest(this.config.apiNewHalt, payload);
  }

  async updateResumption(payload) {
    return this.executeHaltRequest(this.config.apiResumption, payload);
  }

  // SSE
  async getSSETicket() {
    const response = await fetch(this.config.apiSSEticket, {
      method: "POST",
      headers: this.getAuthHeader(),
    });
    return this.handleResponse(response);
  }

  /**
 * Parses API error responses into a user-friendly error message.
 * Handles various error formats from the backend.
 * @param {Object} errorResponse - The error response data from err.response.data
 * @returns {string} - Formatted error message
 */
  parseApiError = (errorResponse) => {
    if (!errorResponse) return "An unknown error occurred.";

    const { status, error, message, fieldErrors } = errorResponse;
    let errorMessage = "";

    // Prioritize detailed message if available
    if (message && typeof message === 'string') {
      errorMessage += message;

      // Handle field-specific validation errors
      if (fieldErrors && typeof fieldErrors === 'object') {
        const fieldErrorMessages = Object.entries(fieldErrors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join("\n");
        errorMessage += `:\n${fieldErrorMessages}`;
      }
    }

    // Fallback to error type and status
    if (error && status) {
      errorMessage = `${error} (Status: ${status}) \n${errorMessage}`;
    } else if (error) {
      errorMessage = `${error} \n${errorMessage}`;
    } else if (status) {
      errorMessage = `Request failed with status ${status} \n${errorMessage}`;
    } else if (!errorMessage) {
      errorMessage = "An unknown error occurred.";
    }
    return errorMessage;
  };

}

export const apiService = new ApiService();
