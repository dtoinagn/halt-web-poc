window.runConfig = {
  // Mock server endpoints running on localhost:3001
  apiRetrieveData: "http://localhost:3001/api/halts/active",
  apiHaltSearch: "http://localhost:3001/api/halt/search",
  apiFetchSecurities: "http://localhost:3001/api/securities",
  apiFetchHaltReasons: "http://localhost:3001/api/halt-reasons",
  apiFetchHaltRemainReasons: "http://localhost:3001/api/halt-remain-reasons",
  apiNewHalt: "http://localhost:3001/api/halt/create",
  apiHaltUpdate: "http://localhost:3001/api/halt/update",
  apiResumptionDraft:"http://localhost:3001/api/halt/resume/",
  apiSSEticket: "http://localhost:3001/api/sse/ticket",
  apiSSEstream: "http://localhost:3001/api/sse/stream/",

  // Authentication endpoints (used by LogIn.js)
  apiUserLogIn: "http://localhost:3001/auth/login",
  apiLogin: "http://localhost:3001/auth/login",
  apiLogout: "http://localhost:3001/auth/logout",
  apiVerifyToken: "http://localhost:3001/auth/verify",

  // Configuration values
  notificationTimeout: 5000,
  inactivityLimitMinute: 300,
  userLogInCookieExpirationMinute: 60,
  // Enable mock SSE
  useMockSSE: true,
};
