# HALT Web Portal
A React front-end that manage the order-halt workflow for trading systems.  The app is built on top of Create React App and uses an Express-based mock API (see `mock-server.js`) so you can experiment with halt/ resumption flows, idempotency handling, and server-sent events without requiring a real backend.

## Project Structure & Highlights

* `src/` � React components, services, utilities, and tests.  Components are grouped by feature (dashboard, login, common UI, etc.).
* `mock-server.js` � simple Express server serving data from `mock-data/*.json`.
* `scripts/` � helper scripts (CSV conversion, PowerShell automation).
* `public/` & `build/` � generated static assets.  Several `runtime-config-*.js` files are used to switch environments.

The UI supports login, viewing/creating/editing halts, canceling/resuming halts, and a basic dashboard with live updates via SSE.

---

## Prerequisites

1. **Node.js** (16.x or later recommended) and npm/yarn installed.
2. Clone the repository:
   ```bash
   git clone https://Market-Surveillance@dev.azure.com/Market-Surveillance/Equity%20Halt%20Trading/_git/Halt_Web_Portal halt-web
   cd halt-web
   ```
3. Install dependencies:
   ```bash
   npm install
   ```


## Getting Started Locally

### Start the mock API

In one terminal:
```bash
npm run mock-server
```
The server listens on port 3001 by default and returns the contents of the JSON files under `mock-data/`.

### Run the React app

You have a couple of options:
* **Development only**
  ```bash
  npm start
  ```
  Opens [http://localhost:3000](http://localhost:3000) and reloads when you edit source files.

* **API + app together**
  ```bash
  npm run local
  ```
  Uses `concurrently` to launch both `mock-server` and `start` in a single command.

* **Environment-specific dev server**
  ```bash
  npm run test-dev          # uses .env.dev
  ```

Runtime configuration is determined by the `runtime-config-*.js` file copied into `public/` during build; inspect the `build/` folder to see the output used for each environment.


## Available npm Scripts

| Script | Description |
|--------|-------------|
| `start` | Start CRA development server (PORT=3000) |
| `mock-server` | Launch express mock API on port�3001 |
| `local` | Run both `start` and `mock-server` concurrently |
| `test` | Launch Jest test runner (watch mode) |
| `test-dev` | Development server with `.env.dev` configurations |
| `build:dev`/`:qa`/`:prod` | Build static assets for the indicated environment |
| `eject` | Eject CRA configuration (one-way) |


## Testing

Unit tests live alongside source code under `src/__tests__/`.  The suite includes idempotency utilities, date helpers, and a handful of basic component tests.  Run them with:
```bash
npm test
```


## Deployment

Build commands use `env-cmd` to load environment variables from `.env.*` files.  Output is placed in `build/`; serve it with any static file server or deploy to an S3 bucket, Netlify, etc.  The `runtime-config-<env>.js` file allows the same build to be re-used across environments by swapping the config script.


## Useful Tips & Tasks

* **Inspect mock data** � JSON files under `mock-data/` are the canonical source for API responses.
* **Adding new endpoints** � edit `mock-server.js` and restart the server.
* **Cleaning coverage** � a coverage report is generated under `coverage/` when tests run.
* **Contributing** � follow standard git workflow; linting/formatting is handled by CRA defaults.


---