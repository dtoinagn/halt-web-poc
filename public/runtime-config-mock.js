window.runConfig = {
  // Mock server endpoints running on localhost:3001
  apiRetrieveData: "http://localhost:3001/api/halts/activelist",
  apiFetchSecurities: "http://localhost:3001/api/securities",
  apiFetchHaltReasons: "http://localhost:3001/api/halt-reasons",
  apiNewHalt: "http://localhost:3001/api/halt/create",
  apiUpdateExtendedHaltState: "http://localhost:3001/api/halt/update",
  apiSSEticket: "http://localhost:3001/api/auth/request-sse-ticket",
  apiSSEstream: "http://localhost:3001/api/sse?ticket=",

  // Authentication endpoints (used by LogIn.js)
  apiUserLogIn: "http://localhost:3001/auth/login",
  apiLogin: "http://localhost:3001/auth/login",
  apiLogout: "http://localhost:3001/auth/logout",
  apiVerifyToken: "http://localhost:3001/auth/verify",

  // Configuration values
  notificationTimeout: 5000,
  userLogInCookieExpirationMinute: 60,
  // Enable mock SSE
  useMockSSE: true,
};
