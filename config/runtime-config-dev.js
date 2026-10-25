window['runConfig'] = {
    apiHaltSearch: "http://stg-01-dev:8081/api/halt/search",
    apiUserLogIn: 'http://stg-01-dev:8099/api/auth/login',
    apiRetrieveData: 'http://stg-01-dev:8081/api/halt/activelist',
    apiSSEticket: 'http://stg-01-dev:8085/api/auth/request-sse-ticket',
    apiSSEstream: 'http://stg-01-dev:8085/api/sse?ticket=',
    apiNewHalt: 'http://stg-01-dev:8081/api/halt/create',
    apiHaltUpdate: 'http://stg-01-dev:8081/api/halt/update',
    apiResumptionDraft:"http://localhost:3001/api/halt/resume/",
    apiFetchSecurities:'http://stg-01-dev:8081/api/securities',
    apiFetchHaltReasons: 'http://stg-01-dev:8081/api/halt-reasons',
    apiFetchHaltRemainReasons: "http://stg-01-dev:8081/api/halt-remain-reasons",
    closingHour: 22,
    openingHour: 7, 
    inactivityLimitMinute: 480,
    userLogInCookieExpirationMinute: 480,
    notificationTimeout: 2000
}
