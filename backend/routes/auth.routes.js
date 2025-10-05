// File: backend/routes/auth.routes.js

const express = require("express");
const router = express.Router();

// Step 1: Import the function that will handle the login logic
// This function is usually in a "controllers" file.
const { loginUser } = require("../controllers/auth.controller.js");

router.post("/login", loginUser);

module.exports = router;