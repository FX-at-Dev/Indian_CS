const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// ROUTE IMPORTS
const createReportsRouter = require("./routes/reports");
const authRoutes = require("./routes/auth.routes.js"); // <--- STEP 1: YEH LINE ADD KARO
const errorHandler = require("./middleware/errorHandler");
const mongo = require("./db/mongo");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ limit: "40mb", extended: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Test routes
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});
app.get("/api", (req, res) => {
  res.json({ message: "API is working 🚀" });
});

// API ROUTES
app.use("/api/reports", createReportsRouter(io));
app.use("/api/auth", authRoutes); // <--- STEP 2: YEH LINE ADD KARO

// Central error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
mongo
  .connect()
  .then(() => {
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to start server - MongoDB connection error', err);
    process.exit(1);
  });