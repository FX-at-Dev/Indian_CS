// File: backend/routes/report.routes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const {
  createReport,
  fetchAllReports,
  computeKPIs,
  findReportById
} = require("../models/reportModel");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// ---------------------- Middleware ----------------------

// Verify JWT Token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Check if user is Government or Admin
function requireGovernmentRole(req, res, next) {
  if (!req.user || (req.user.role !== "government" && req.user.role !== "admin")) {
    return res.status(403).json({ error: "Only government officials can perform this action" });
  }
  next();
}

// ---------------------- Router Factory ----------------------

function createReportsRouter(io) {
  // CREATE a report (Anonymous or Authenticated)
  router.post("/", async (req, res) => {
    try {
      const { title, description, severity, imageUrl, lat, lng, reporterName, city } = req.body;

      if (!title || !description || !severity || !lat || !lng || !city) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const reportData = {
        title,
        description,
        severity,
        imageUrl: imageUrl || null,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        reporterName: reporterName || "Anonymous User",
        city
      };

      const newReport = await createReport(reportData);

      if (io && typeof io.emit === "function") {
        io.emit("newReport", newReport);
      }

      res.status(201).json({
        message: "Report created successfully",
        reportId: newReport._id
      });
    } catch (err) {
      console.error("Create report error:", err);
      res.status(500).json({ error: err.message || "Failed to create report" });
    }
  });

  // FETCH all reports (Public)
  router.get("/", async (req, res) => {
    try {
      const reports = await fetchAllReports();
      res.json(reports);
    } catch (err) {
      console.error("Fetch reports error:", err);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // GET KPIs (Public)
  router.get("/kpis", async (req, res) => {
    try {
      const kpis = await computeKPIs();
      res.json(kpis);
    } catch (err) {
      console.error("KPIs error:", err);
      res.status(500).json({ error: "Failed to compute KPIs" });
    }
  });

  // GET report by ID (Public)
  router.get("/:id", async (req, res) => {
    try {
      const report = await findReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }
      res.json(report);
    } catch (err) {
      console.error("Find report error:", err);
      res.status(500).json({ error: "Server error or Invalid ID format" });
    }
  });

  // CLOSE report (Government only)
  router.patch("/:id/close", verifyToken, requireGovernmentRole, async (req, res) => {
    try {
      const report = await findReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      if (report.status === "Closed") {
        return res.status(400).json({ error: "Report is already closed" });
      }

      report.status = "Closed";
      await report.save();

      if (io && typeof io.emit === "function") {
        io.emit("reportClosed", { reportId: report._id });
      }

      res.json({
        message: "Report closed successfully",
        report: report.toObject()
      });
    } catch (err) {
      console.error("Close report error:", err);
      res.status(500).json({ error: "Server error while closing report" });
    }
  });

  return router;
}

module.exports = createReportsRouter;
