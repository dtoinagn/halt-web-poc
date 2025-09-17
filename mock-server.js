const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// In-memory session store (for demo purposes)
const activeSessions = new Map();

// Helper function to generate JWT-like token
const generateToken = (user) => {
  const payload = {
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
};

// Helper function to verify token
const verifyToken = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    return payload;
  } catch {
    return null;
  }
};

// Mock authentication middleware
app.use((req, res, next) => {
  // Skip auth for OPTIONS requests and auth endpoints
  if (req.method === "OPTIONS" || req.path.startsWith("/auth/")) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = payload;
  next();
});

// Helper function to read JSON files
const readJsonFile = (filename) => {
  try {
    const filePath = path.join(__dirname, "mock-data", filename);
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return [];
  }
};

// Authentication routes

// Login endpoint
app.post("/auth/login", (req, res) => {
  console.log("POST /auth/login");
  console.log("Login attempt:", {
    username: req.body.username,
    password: "***",
  });

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const users = readJsonFile("users.json");
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    console.log("Login failed: Invalid credentials");
    return res.status(401).json({
      status: "FAIL",
      httpStatus: "UNAUTHORIZED",
      message: "Invalid credentials",
    });
  }

  const token = generateToken(user);
  activeSessions.set(token, user);

  console.log(`Login successful for user: ${user.username} (${user.role})`);

  // Return format expected by LogIn.js handleLogIn function
  res.json({
    status: "SUCCESS",
    username: user.username,
    jwt: token,
    user: {
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
    },
  });
});

// Logout endpoint
app.post("/auth/logout", (req, res) => {
  console.log("POST /auth/logout");

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    activeSessions.delete(token);
    console.log("User logged out successfully");
  }

  res.json({ success: true, message: "Logged out successfully" });
});

// Verify token endpoint
app.get("/auth/verify", (req, res) => {
  console.log("GET /auth/verify");

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || !activeSessions.has(token)) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  res.json({
    valid: true,
    user: {
      username: payload.username,
      role: payload.role,
      fullName: payload.fullName,
    },
  });
});

// Routes based on your Dashboard.js API calls

// Fetch securities endpoint
app.get("/api/securities", (req, res) => {
  console.log("GET /api/securities");
  const securities = readJsonFile("securities.json");
  res.json(securities);
});

// Fetch halt reasons endpoint
app.get("/api/halt-reasons", (req, res) => {
  console.log("GET /api/halt-reasons");
  const haltReasons = readJsonFile("halt-reasons.json");
  res.json(haltReasons);
});

// Fetch active halts endpoint
app.get("/api/halts/active", (req, res) => {
  console.log("GET /api/halts/active");
  const activeHalts = readJsonFile("active-halts.json");
  res.json(activeHalts);
});

// Create new halt endpoint
app.post("/api/halt/create", (req, res) => {
  console.log("POST /api/halt/create");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  // Mock successful response
  res.json({
    success: true,
    message: "Halt created successfully",
    haltId: `HALT${Date.now()}`,
    data: req.body,
  });
});

// Update extended halt state endpoint
app.post("/api/halt/update-extended", (req, res) => {
  console.log("POST /api/halt/update-extended");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  // Check if this is HALT009 - simulate an error for testing ErrorDialog
  if (req.body.haltId === "HALT009") {
    console.log("Simulating error for HALT009");
    return res.status(400).json({
      httpStatus: "BAD_REQUEST",
      status: "Validation Error",
      detailedMessage: "Issue Name is mandatory",
      username: "tester",
    });
  }

  // Mock successful response for all other halts
  res.json({
    success: true,
    message: "Extended halt state updated successfully",
  });
});

// SSE ticket endpoint (mock)
app.post("/api/sse/ticket", (req, res) => {
  console.log("POST /api/sse/ticket");
  res.json({
    sseTicket: "mock-sse-ticket-" + Date.now(),
  });
});

// SSE stream endpoint (mock)
app.get("/api/sse/stream/:ticket", (req, res) => {
  console.log(`GET /api/sse/stream/${req.params.ticket}`);

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Cache-Control",
  });

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({ heartbeat: true, timestamp: Date.now() })}\n\n`
    );
  }, 30000);

  // Clean up on client disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Catch all other routes
app.use("*", (req, res) => {
  console.log(`Unhandled ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log("");
  console.log("Authentication:");
  console.log("  POST /auth/login");
  console.log("  POST /auth/logout");
  console.log("  GET  /auth/verify");
  console.log("");
  console.log("API:");
  console.log("  GET  /api/securities");
  console.log("  GET  /api/halt-reasons");
  console.log("  GET  /api/halts/active");
  console.log("  POST /api/halt/create");
  console.log("  POST /api/halt/update-extended");
  console.log("  POST /api/sse/ticket");
  console.log("  GET  /api/sse/stream/:ticket");
  console.log("");
  console.log("Other:");
  console.log("  GET  /health");
  console.log("");
  console.log("Test users:");
  console.log("  admin / password123 (admin)");
  console.log("  trader1 / trader123 (trader)");
  console.log("  trader2 / trader123 (trader)");
  console.log("  supervisor / super123 (supervisor)");
  console.log("  analyst / analyst123 (analyst)");
});
