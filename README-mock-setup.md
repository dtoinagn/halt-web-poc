# Mock Server Setup for Frontend Testing

This setup allows you to test the frontend without running the actual backend server.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Option A - Run both frontend and mock server together:**
   ```bash
   npm run dev
   ```

3. **Option B - Run separately:**
   ```bash
   # Terminal 1 - Start mock server
   npm run mock-server
   
   # Terminal 2 - Start React app
   npm start
   ```

## Configuration

### Using Mock APIs
To use mock APIs, you need to update your `public/index.html` to load the mock configuration:

```html
<!-- Replace this line: -->
<script src="%PUBLIC_URL%/runtime-config.js"></script>

<!-- With this line: -->
<script src="%PUBLIC_URL%/runtime-config-mock.js"></script>
```

### Mock Server Endpoints
The mock server runs on `http://localhost:3001` and provides these endpoints:

**Authentication:**
- `POST /auth/login` - Login with username/password
- `POST /auth/logout` - Logout and invalidate token
- `GET /auth/verify` - Verify token validity

**API:**
- `GET /api/securities` - Returns mock securities data
- `GET /api/halt-reasons` - Returns mock halt reasons
- `GET /api/halts/active` - Returns mock active halts data  
- `POST /api/halt/create` - Mock endpoint for creating halts
- `POST /api/halt/update-extended` - Mock endpoint for updating halt state
- `POST /api/sse/ticket` - Mock SSE ticket endpoint
- `GET /api/sse/stream/:ticket` - Mock SSE stream endpoint

**Other:**
- `GET /health` - Health check endpoint

### Test Users
The following users are available for testing:

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | admin |
| trader1 | trader123 | trader |
| trader2 | trader123 | trader |
| supervisor | super123 | supervisor |
| analyst | analyst123 | analyst |

### Mock Data Files
Mock data is stored in the `mock-data/` directory:

- `securities.json` - Sample securities/symbols data
- `halt-reasons.json` - Sample halt reason codes  
- `active-halts.json` - Sample active halts data

You can modify these files to test different scenarios.

## Testing Your Refactored Component

1. Start the mock server and React app using `npm run dev`
2. Navigate to your dashboard
3. Click "Create new halts" button
4. The CreateNewHaltModal should now load data from mock server
5. Try selecting different symbols and halt reasons
6. Submit the form to see the mock API call in the console

## Switching Back to Real Backend

To switch back to the real backend:

1. Update `public/index.html` to use `runtime-config.js` instead of `runtime-config-mock.js`
2. Stop the mock server
3. Start your actual backend server

## Mock Server Console Output

The mock server logs all requests to the console, so you can see what API calls your frontend is making and verify the request data.