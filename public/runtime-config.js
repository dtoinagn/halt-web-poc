window['runConfig'] = {
    apiUserLogIn: 'http://stg-01-qa:8081/auth/login',
    apiRetrieveData: 'http://stg-01-qa:8081/api/halt/activelist',
    apiSSEticket: 'http://stg-01-qa:8085/api/auth/request-sse-ticket',
    apiSSEstream: 'http://stg-01-qa:8085/api/sse?ticket=',
    apiNewHalt: 'http://stg-01-qa:8081/api/halt/create',
    apiUpdateHaltState: 'http://stg-01-qa:8081/api/halt/update-extended',
    apiFetchSecurities:'http://stg-01-qa:8081/api/securities',
    apiFetchHaltReasons: 'http://stg-01-qa:8081/api/halt-reasons',
    apiFetchHaltRemainReasons: 'http://stg-01-qa:8081/api/halt-remain-reasons',
    apiHaltUpdate: 'http://stg-01-qa:8081/api/halt/update',
    apiCreateResumption: 'http://stg-01-qa:8081/api/halt/update',
    closingHour: 22,
    openingHour: 7, 
    inactivityLimitMinute: 480,
    userLogInCookieExpirationMinute: 480,
    notificationTimeout: 1000 * 60 * 40
}


