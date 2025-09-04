// API service layer for centralized API calls

class ApiService {
  constructor() {
    this.config = window.runConfig || {};
  }

  getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Error ${response.status}: ${errorMessage}`);
    }
    return response.json();
  }

  // Authentication
  async login(credentials) {
    const response = await fetch(this.config.apiUserLogIn, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return response.json();
  }

  // Halt data
  async fetchActiveHalts() {
    const response = await fetch(this.config.apiRetrieveData, {
      method: 'GET',
      headers: this.getAuthHeader()
    });
    return this.handleResponse(response);
  }

  async fetchSecurities() {
    const response = await fetch(this.config.apiFetchSecurities, {
      method: 'GET',
      headers: this.getAuthHeader()
    });
    return this.handleResponse(response);
  }

  async fetchHaltReasons() {
    const response = await fetch(this.config.apiFetchHaltReasons, {
      method: 'GET',
      headers: this.getAuthHeader()
    });
    return this.handleResponse(response);
  }

  async updateExtendedHaltState(payload) {
    const response = await fetch(this.config.apiUpdateExtendedHaltState, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  async createNewHalt(payload) {
    const response = await fetch(this.config.apiNewHalt, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload)
    });
    return this.handleResponse(response);
  }

  // SSE
  async getSSETicket() {
    const response = await fetch(this.config.apiSSEticket, {
      method: 'POST',
      headers: this.getAuthHeader()
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();