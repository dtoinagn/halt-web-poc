// API service layer for centralized API calls

class ApiService {
  constructor() {
    this.config = window.runConfig || {};
  }

  getAuthHeader() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  async handleResponse(response) {
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
              throw new Error(`Error ${response.status}: ${errorText}`);
            }
          } else {
            throw new Error(`Error ${response.status}: ${errorText}`);
          }
        } catch (textError) {
          throw new Error(
            `Error ${response.status}: Unable to parse error response`
          );
        }
      }

      // If we have errorData, create a proper error with response attached
      const error = new Error(`Error ${response.error || response.status}`);
      error.message = errorData;
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

  async updateHaltState(payload) {
    const response = await fetch(this.config.apiUpdateHaltState, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(response);
  }

  async createNewHalt(payload) {
    const response = await fetch(this.config.apiNewHalt, {
      method: "POST",
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse(response);
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
