// Application constants

import { C } from "@table-library/react-table-library/Cell-a4350b14";

export const HALT_STATES = {
  ACTIVE_REG_HALT: "ACTIVE_REG_HALT",
  ACTIVE_SSCB_HALT: "ACTIVE_SSCB_HALT",
  PENDING_HALT: "PENDING_HALT",
  ACTIVE_TRADING: "ACTIVE_TRADING",
};

export const HALT_TYPES = {
  REG: "REG",
  SSCB: "SSCB",
  SSCB_REG: "SSCB_REG",
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
  MODIFY_HALT_DETAILS: "ModifyHaltDetails",
  EXTEND_HALT: "ExtendHalt",
  REMAINED_HALT: "RemainedHalt",
  PROLONG_5MIN: "ExtendSscbHalt",
  CONVERT_TO_REG: "ConvertSscbToHalt",
  MODIFY_HALT_REASON:"ModifyHaltReason"
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
    "Remained",
    "Action",
  ],
  ACTIVE_SSCB: [
    "Halt Event ID",
    "Symbol",
    "Issue Name",
    "Listing Mkt",
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
