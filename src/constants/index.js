// Application constants

export const HALT_STATUSES = {
  HALTED: "Halted",
  RESUMED: "Resumed",
  RESUMPTION_PENDING: "ResumptionPending",
  HALT_SCHEDULED: "HaltScheduled",
  HALT_PENDING: "HaltPending",
  HALT_PENDING_CANCELLED: "HaltPendingCancelled",
};

export const HALT_TYPES = {
  REG: "REG",
  SSCB: "SSCB",
};

export const HALT_ACTIONS = {
  CREATE_IMMEDIATE_HALT: "CreateImmediateHalt",
  CREATE_IMMEDIATE_RESUMPTION: "CreateImmediateResumption",
  CREATE_SCHEDULED_HALT: "CreateScheduledHalt",
  CREATE_SCHEDULED_RESUMPTION: "CreateScheduledResumption",
  MODIFY_SCHEDULED_HALT: "ModifyScheduledHalt",
  MODIFY_SCHEDULED_RESUMPTION: "ModifyScheduledResumption",
  CANCEL_SCHEDULED_HALT: "CancelScheduledHalt",
  CANCEL_SCHEDULED_RESUMPTION: "CancelScheduledResumption",
  EXTEND_HALT: "ExtendHalt",
  LIFT_HALT: "LiftHalt",
  CANCEL_HALT: "CancelHalt",
  SCHEDULE_HALT: "ScheduleHalt",
  EDIT_SCHEDULED_HALT: "ModifyScheduledHalt",
};

export const TABLE_COLUMNS = {
  ACTIVE_REG: [
    "Halt Event ID",
    "Symbol",
    "Issue Name",
    "Listing Mkt",
    "All Issues",
    "Created By",
    "Halt Time",
    "Sched Resumption Time",
    "Extd",
    "Action",
  ],
  ACTIVE_SSCB: [
    "Halt Event ID",
    "Symbol",
    "Issue Name",
    "Listing Mkt",
    "All Issues",
    "Created By",
    "Halt Time",
    "Sched Resumption Time",
    "Action",
  ],
  PENDING: [
    "Halt Event ID",
    "Symbol",
    "Status",
    "Issue Name",
    "Listing Mkt",
    "All Issues",
    "Created By",
    "Sched Halt Time",
    "Action",
  ],
  LIFTED: [
    "Halt Event ID",
    "Symbol",
    "Issue Name",
    "Listing Mkt",
    "All Issues",
    "Created By",
    "Halt Time",
    "Sched Resumption Time",
  ],
};

export const COLUMN_KEY_MAP = {
  "Halt Event ID": "haltId",
  Symbol: "symbol",
  Status: "status",
  "Issue Name": "issueName",
  "Listing Mkt": "listingMarket",
  "All Issues": "allIssue",
  "Created By": "createdBy",
  "Halt Time": "haltTime",
  "Sched Resumption Time": "resumptionTime",
  Extd: "extendedHalt",
  "Sched Halt Time": "haltTime",
};

export const DEFAULT_SORT_PREFERENCES = {
  activeRegOrderedBy: "haltTime",
  activeRegOrderDirection: "desc",
  activeSSCBOrderedBy: "haltTime",
  activeSSCBOrderDirection: "desc",
  pendingOrderedBy: "haltTime",
  pendingOrderDirection: "desc",
  todayLiftedOrderedBy: "haltTime",
  todayLiftedOrderDirection: "desc",
};

export const ROUTE_PATHS = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  HISTORY: "/history",
  USER_GUIDE: "/userguide",
  ROOT: "/",
};
