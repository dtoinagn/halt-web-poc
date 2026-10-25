// Runtime configuration shipped with every build (dev / qa / prod).
// All API URLs are relative: httpd on the same host proxies each path prefix
// to its backend service (see deploy/httpd/halt-portal.conf), so no backend
// hostname or port is ever sent to the browser.
//
//   /halt-svc/  -> halt API      (8081)
//   /sse-svc/   -> SSE service   (8085)
//   /auth-svc/  -> auth service  (8099)
//
// The non-URL values below can be edited on the server after install without
// rebuilding.
window['runConfig'] = {
    apiUserLogIn: '/auth-svc/api/auth/login',
    apiRetrieveData: '/halt-svc/api/halt/activelist',
    apiHaltSearch: '/halt-svc/api/halt/search',
    apiNewHalt: '/halt-svc/api/halt/create',
    apiHaltUpdate: '/halt-svc/api/halt/update',
    apiResumptionDraft: '/halt-svc/api/halt/resume/',
    apiFetchSecurities: '/halt-svc/api/securities',
    apiFetchHaltReasons: '/halt-svc/api/halt-reasons',
    apiFetchHaltRemainReasons: '/halt-svc/api/halt-remain-reasons',
    apiSSEticket: '/sse-svc/api/auth/request-sse-ticket',
    apiSSEstream: '/sse-svc/api/sse?ticket=',
    closingHour: 22,
    openingHour: 7,
    inactivityLimitMinute: 480,
    userLogInCookieExpirationMinute: 480,
    notificationTimeout: 1000 * 60 * 40
}
