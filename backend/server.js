const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const createReportsRouter = require("./routes/reports");
const errorHandler = require("./middleware/errorHandler");
const mongo = require("./db/mongo");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "40mb" })); // increase JSON body size
app.use(express.urlencoded({ limit: "40mb", extended: true })); // if using forms

// Create HTTP server for both Express & Socket.IO
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: { origin: "*" }, // allow frontend
});

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running with MySQL 🚀");
});

// Simple /api test route
app.get("/api", (req, res) => {
  res.json({ message: "API is working 🚀" });
});

// Mount reports routes under /api/reports
app.use("/api/reports", createReportsRouter(io));

// central error handler
app.use(errorHandler);

// Start server after connecting to MongoDB
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
