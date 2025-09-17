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
      const error = new Error(`Error ${response.status}`);
      error.response = { data: errorData };
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

  async updateExtendedHaltState(payload) {
    const response = await fetch(this.config.apiUpdateExtendedHaltState, {
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
}

export const apiService = new ApiService();
