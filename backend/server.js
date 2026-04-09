// File: backend/server.js

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require("path");

// --- Import Routers ---
const createReportsRouter = require("./routes/report.routes"); // ✅ Correct import path
const authRouter = require("./routes/auth.routes");
const errorHandler = require("./middleware/errorHandler");
const mongo = require("./db/mongo");
const leaderboardRouter = require('./routes/leaderboard');

const REQUIRED_ENV_VARS = ["JWT_SECRET", "MONGO_URI"];
const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const DEFAULT_CORS_ORIGINS = "https://indiancs.netlify.app,http://localhost:8080";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || DEFAULT_CORS_ORIGINS)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

// -------------------- Middleware --------------------
app.use(cors({ origin: CORS_ORIGINS }));
app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ limit: "40mb", extended: true }));

// -------------------- Static Frontend --------------------
// ✅ Serve the frontend properly from root or build folder
app.use(express.static(path.join(__dirname, "../client"))); // or "../frontend" depending on structure

// -------------------- Create HTTP + Socket.IO --------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGINS,
  },
});

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// -------------------- Test Routes --------------------
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.get("/api", (req, res) => {
  res.json({ message: "API is working 🚀" });
});

// -------------------- Main Routes --------------------

// Auth Routes
app.use("/api/auth", authRouter);

// Report Routes
app.use("/api/reports", createReportsRouter(io));

// Leaderboard Routes
app.use('/api/leaderboard', leaderboardRouter);

// -------------------- Global Error Handler --------------------
app.use(errorHandler);

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 10000;

mongo
  .connect()
  .then(() => {
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ Failed to start server - MongoDB connection error", err);
    process.exit(1);
  });
