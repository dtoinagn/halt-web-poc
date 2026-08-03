// Application constants

export const HALT_STATES = {
  ACTIVE_REG_HALT: "ACTIVE_REG_HALT",
  ACTIVE_SSCB_HALT: "ACTIVE_SSCB_HALT",
  PENDING_HALT: "PENDING_HALT",
  ACTIVE_TRADING: "ACTIVE_TRADING",
  DRAFT_REG_HALT: "DRAFT_REG_HALT",
};

export const HALT_TYPES = {
  REG: "REG",
  SSCB: "SSCB",
  SSCB_REG: "SSCB_REG",
};

export const HALT_ACTIONS = {
  CREATE_IMMEDIATE_HALT: "CreateImmediateHalt",
  CREATE_HALT_DRAFT: "CreateHaltDraft",
  CREATE_IMMEDIATE_RESUMPTION: "CreateImmediateResumption",
  CREATE_SCHEDULED_HALT: "CreateScheduledHalt",
  CREATE_SCHEDULED_RESUMPTION: "CreateScheduledResumption",
  CREATE_RESUMPTION_DRAFT: "CreateResumptionDraft",
  MODIFY_SCHEDULED_HALT: "ModifyScheduledHalt",
  MODIFY_SCHEDULED_RESUMPTION: "ModifyScheduledResumption",
  MODIFY_HALT_DRAFT: "ModifyHaltDraft",
  MODIFY_RESUMPTION_DRAFT: "ModifyResumptionDraft",
  CANCEL_SCHEDULED_HALT: "CancelScheduledHalt",
  CANCEL_SCHEDULED_RESUMPTION: "CancelScheduledResumption",
  CANCEL_HALT_DRAFT: "CancelHaltDraft",
  CANCEL_RESUMPTION_DRAFT: "CancelResumptionDraft",
  SUBMIT_HALT_DRAFT: "SubmitHaltDraft",
  SUBMIT_RESUMPTION_DRAFT: "SubmitResumptionDraft",
  MODIFY_HALT_DETAILS: "ModifyHaltDetails",
  EXTEND_HALT: "ExtendHalt",
  REMAINED_HALT: "RemainedHalt",
  PROLONG_5MIN: "ExtendSscbHalt",
  CONVERT_TO_REG: "ConvertSscbToHalt",
  MODIFY_HALT_REASON:"ModifyHaltReason",
  CREATE_DRAFT_RESUMPTION: "CreateDraftResumption",
};

export const TABLE_COLUMNS = {
  ACTIVE_REG: [
    "Symbol",
    "Halt Event ID",
    "Status",
    "Issue Name",
    "Listing Mkt",
    "All Issues",
    "Created By",
    "Halt Time",
    "Sched Resumption Time",
    "Extd",
    "Remained",
    "Action",
  ],
  ACTIVE_SSCB: [
    "Symbol",
    "Halt Event ID",
    "Issue Name",
    "Listing Mkt",
    "Halt Time",
    "Sched Resumption Time",
    "Action",
  ],
  PENDING: [
    "Symbol",
    "Halt Event ID",
    "Status",
    "Issue Name",
    "Listing Mkt",
    "All Issues",
    "Created By",
    "Sched Halt Time",
    "Action",
  ],
  LIFTED: [
    "Symbol",
    "Halt Event ID",
    "Issue Name",
    "Listing Mkt",
    "All Issues",
    "Created By",
    "Halt Time",
    "Resumption Time",
  ],
};

export const COLUMN_KEY_MAP = {
  "Halt Event ID": "haltId",
  Symbol: "symbol",
  Status: "state",
  "Issue Name": "issueName",
  "Listing Mkt": "listingMarket",
  "All Issues": "allIssue",
  "Created By": "createdBy",
  "Halt Time": "haltTime",
  "Sched Resumption Time": "resumptionTime",
  Extd: "extendedHalt",
  Remained: "remainedHalt",
  "Sched Halt Time": "haltTime",
  "Resumption Time": "resumptionTime",
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
