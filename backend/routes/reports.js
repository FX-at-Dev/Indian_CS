const express = require("express");
const router = express.Router();
const { createReport, fetchAllReports, computeKPIs } = require("../models/reportModel");

// Factory to create router with access to io
module.exports = function (io) {
  // create a report
  router.post("/", async (req, res, next) => {
    try {
      const { title, description, email, severity, img, lat, lng } = req.body;

      if (!title || !description || !email || !severity || !lat || !lng) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const newReport = await createReport({ title, description, email, severity, img, lat, lng });

      // emit event
      if (io && typeof io.emit === "function") io.emit("newReport", newReport);

      res.status(201).json({ message: "Report created", reportId: newReport.id });
    } catch (err) {
      next(err);
    }
  });

  // fetch all reports
  router.get("/", async (req, res, next) => {
    try {
      const rows = await fetchAllReports();
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  // kpis
  router.get("/kpis", async (req, res, next) => {
    try {
      const kpis = await computeKPIs();
      res.json(kpis);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
