# Halt Portal — Technical Review

---

## Slide 1 — Project Overview

**Halt Portal** is an internal financial market operations web application that enables market operations staff to create, monitor, manage, and resume **trading halts** on listed securities in real time.

### Core Capabilities

- Initiate **immediate** or **scheduled** regulatory (REG) halts
- Monitor **Single Stock Circuit Breaker (SSCB)** halts triggered automatically by the market
- Convert SSCB halts to regulatory halts, prolong SSCB durations
- Schedule, modify, and cancel resumptions
- Mark halts as **Extended** or **Remained** with supporting reasons
- View today's **lifted halts** and browse full **halt history**

**Key Users:** Market operations staff who need real-time visibility and control of trading activity.

---

## Slide 2 — System Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                         │
│                    React 18 + MUI v6                         │
│                                                              │
│   ┌─────────────┐   REST API calls   ┌────────────────────┐  │
│   │  Dashboard  │ ─────────────────► │   Backend REST API │  │
│   │  (CRUD ops) │ ◄─────────────────  │  (JWT-secured)     │  │
│   └─────────────┘                    └────────────────────┘  │
│          │                                    │               │
│          │    SSE stream (real-time updates)  │               │
│          └────────────────────────────────────┘               │
│                                                              │
│   Auth: JWT token (localStorage) + session cookie            │
│   Config: window.runConfig (injected at runtime)             │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18.2 |
| Component Library | Material UI v6 |
| Routing | React Router v7 |
| Date Handling | dayjs (with timezone plugin) |
| Real-time Updates | Server-Sent Events (SSE) |
| Auth State | JWT + HTTP-only cookies |
| Build / Environments | react-scripts + env-cmd (dev/qa/prod) |
| Testing | Jest + React Testing Library |

---

## Slide 3 — Components Architecture

```
App.js
├── Context Providers
│   ├── ColorModeContext (theme)
│   └── LoggedInUserContext (auth state, navbar state)
│
├── Layout
│   ├── TopBar (logo, user, theme toggle)
│   └── NavBar (collapsible sidebar: Dashboard / History / User Guide)
│
└── Routes
    ├── /login        → Login
    ├── /dashboard    → Dashboard  ← Primary operational view
    │     ├── useHaltData hook (data fetching + state)
    │     ├── useSSE hook (real-time updates)
    │     ├── DashboardTabs (REG | SSCB | Pending | Lifted)
    │     ├── ActiveRegTable
    │     │   ├── ResumeHaltModal
    │     │   ├── CancelResumptionModal
    │     │   ├── EditHaltReasonModal
    │     │   └── RemainHaltModal
    │     ├── ActiveSSCBTable
    │     │   ├── ProlongSSCBHaltModal
    │     │   └── ConvertSSCBHaltModal
    │     ├── PendingTable
    │     │   ├── EditScheduledHaltModal
    │     │   └── CancelHaltModal
    │     ├── LiftedTable
    │     ├── CreateNewHaltModal
    │     └── HaltDetailModal
    ├── /history      → History (past halts)
    └── /userguide    → UserGuide
```

### Custom Hooks

| Hook | Responsibility |
|---|---|
| `useHaltData` | Initial data fetching, state management, halt action dispatchers |
| `useSSE` | SSE connection lifecycle, rAF-batched real-time state updates, notifications |

### Service & Utility Layer

| Module | Responsibility |
|---|---|
| `api.js` (ApiService) | Centralized HTTP calls, auth headers, idempotency, retry logic, 401 handling |
| `haltDataUtils.js` | Categorizes raw halt data into typed buckets; builds API payloads |
| `storageUtils.js` | localStorage + cookie abstractions for auth, sort prefs, column widths |
| `idempotencyUtils.js` | Crypto UUID generation, request ID construction, log-safe key truncation |
| `dateUtils.js` | EST timezone formatting, backend format serialization, datetime comparisons |

---

## Slide 4 — Best Practices Applied

### 1. Idempotency on All Write Operations
Every mutating API call (create halt, update halt, resumption) sends a `UUID v4` as the `Idempotency-Key` header. The server can safely ignore re-delivered requests. Keys are generated using `crypto.randomUUID()` with a `Math.random` fallback for older browsers.

### 2. In-Flight Request Deduplication
`ApiService` maintains an `inFlightRequests` Map keyed on `action:haltId`. If the same logical request fires twice before the first resolves (e.g., double-click), the second call shares the first's promise — preventing double submissions without any UI-level locking.

### 3. Exponential Backoff Retry
Network failures (not HTTP errors) trigger automatic retry with exponential backoff (`1000ms → 2000ms → …`) up to `maxRetries=2`. The same idempotency key is reused across retries, preserving server-side safety.

### 4. SSE with requestAnimationFrame Batching
SSE messages are buffered in a `pendingUpdatesRef` and flushed in a single `requestAnimationFrame` callback. This collapses rapid-fire updates into one React render cycle, avoiding unnecessary reflows on high-frequency market events.

### 5. Separation of Concerns via Custom Hooks
`useHaltData` owns data fetching and state, `useSSE` owns the live stream and notifications. `Dashboard` simply wires them together — keeping components thin and each hook independently testable.

### 6. React Performance Optimizations
`useCallback` and `useMemo` are applied throughout modals for event handlers and derived values (e.g., `isSubmitDisabled`, `confirmMessage`) to prevent unnecessary child re-renders on each keystroke.

### 7. Unsaved Changes Guard
All modals that collect user input compare current form state against the original values and display a confirmation dialog on discard — preventing accidental data loss during critical halt operations.

### 8. Centralized 401 / Session Expiry Handling
`ApiService.handleResponse()` intercepts any `401` response, clears auth state, stores a user-facing message, and redirects to login — consistently enforced across every API call without per-component handling.

### 9. Multi-Environment Build Support
Separate `.env.dev`, `.env.qa`, `.env.prod` files feed environment-specific API endpoints via `env-cmd`. Runtime config is also injectable via `window.runConfig` for container/CDN deployment flexibility.

### 10. Input Validation with Business Rules
Create and edit modals enforce domain-specific rules inline: blocking Circuit Breaker halt reason selection by users, requiring halt times to be in the future and within the current trading day, and preventing duplicate active/scheduled halts per symbol.

### 11. Unit Test Coverage on Critical Paths
Tests cover idempotency logic (key generation, deduplication, retry, request cleanup), date utility functions, and the SSE hook — targeting exactly the logic most likely to cause silent production errors.

### 12. Optimistic UI Updates
State updates for `extended`/`remained` halt toggles are applied locally before the API call resolves, making the UI feel instant. The SSE stream then serves as the authoritative sync source to correct any discrepancy.

---

## Slide 5 — Future Enhancements

| Area | Enhancement |
|---|---|
| **SSE Resilience** | Add automatic SSE reconnection with backoff on `onerror` — currently the connection closes on error and does not attempt to reconnect |
| **Role-Based Access Control** | Differentiate read-only viewers from operators; conditionally hide create/resume/cancel actions based on user role |
| **Audit Trail UI** | Surface per-halt audit log (who changed what, when) directly in the Halt Detail modal |
| **Accessibility (a11y)** | Add ARIA labels, keyboard navigation, and screen reader support across data tables and modals |
| **End-to-End Testing** | Add Playwright or Cypress E2E tests covering the full halt lifecycle (create → active → resume → lifted) |
| **Mobile / Responsive Layout** | Improve narrow-screen behavior for tablets and touch-screen operations terminals |
| **Column Filtering & Export** | Allow per-column filtering on tables and CSV/Excel export of halt data for reporting |
| **Notification Enhancements** | Group and stack multiple simultaneous SSE notifications; add a persistent notification history panel |
| **Performance Monitoring** | Integrate Web Vitals reporting and add React Profiler boundaries around high-frequency table renders |
| **Dependency Cleanup** | Audit and prune unused packages — several UI libraries are installed but not actively referenced in the codebase |
