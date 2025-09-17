// Application constants

export const HALT_STATUSES = {
  HALTED: 'Halted',
  RESUMED: 'Resumed',
  RESUMPTION_PENDING: 'ResumptionPending',
  HALT_PENDING: 'HaltPending'
};

export const HALT_TYPES = {
  REG: 'REG',
  SSCB: 'SSCB'
};

export const HALT_ACTIONS = {
  CREATE_IMMEDIATE_HALT: 'CreateImmediateHalt',
  CREATE_IMMEDIATE_RESUMPTION: 'CreateImmediateResumption',
  CREATE_SCHEDULED_HALT: 'CreateScheduledHalt',
  CREATE_SCHEDULED_RESUMPTION: 'CreateScheduledResumption',
  MODIFY_SCHEDULED_HALT: 'ModifyScheduledHalt',
  MODIFY_SCHEDULED_RESUMPTION: 'ModifyScheduledResumption',
  CANCEL_SCHEDULED_HALT: 'CancelScheduledHalt',
  CANCEL_SCHEDULED_RESUMPTION: 'CancelScheduledResumption',
  EXTEND_HALT: 'ExtendHalt',
  LIFT_HALT: 'LiftHalt',
  CANCEL_HALT: 'CancelHalt',
  SCHEDULE_HALT: 'ScheduleHalt'
};

export const TABLE_COLUMNS = {
  ACTIVE_REG: [
    'Halt ID', 'Symbol', 'Issue Name', 'Listing Market',
    'All Issues', 'Created By', 'Halt Time', 'Resumption Time',
    'Extended Halt', ' ', '   '
  ],
  ACTIVE_SSCB: [
    'Halt ID', 'Symbol', 'Issue Name', 'Listing Market',
    'All Issues', 'Created By', 'Halt Time', 'Resumption Time'
  ],
  PENDING: [
    'Halt ID', 'Symbol', 'Issue Name', 'Listing Market',
    'All Issues', 'Created By', 'Scheduled Halt Time'
  ],
  LIFTED: [
    'Halt ID', 'Symbol', 'Issue Name', 'Listing Market',
    'All Issues', 'Created By', 'Halt Time', 'Resumption Time'
  ]
};

export const COLUMN_KEY_MAP = {
  "Halt ID": "haltId",
  "Symbol": "symbol",
  "Issue Name": "issueName",
  "Listing Market": "listingMarket",
  "All Issues": "allIssue",
  "Created By": "createdBy",
  "Halt Time": "haltTime",
  "Resumption Time": "resumptionTime",
  "Extended Halt": "extendedHalt",
  "Scheduled Halt Time": "haltTime"
};

export const DEFAULT_SORT_PREFERENCES = {
  activeRegOrderedBy: 'haltTime',
  activeRegOrderDirection: 'desc',
  activeSSCBOrderedBy: 'haltTime',
  activeSSCBOrderDirection: 'desc',
  pendingOrderedBy: 'haltTime',
  pendingOrderDirection: 'desc',
  todayLiftedOrderedBy: 'haltTime',
  todayLiftedOrderDirection: 'desc'
};

export const ROUTE_PATHS = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  HISTORY: '/history',
  USER_GUIDE: '/userguide',
  ROOT: '/'
};