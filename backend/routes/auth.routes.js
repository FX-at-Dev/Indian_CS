// File: backend/routes/auth.routes.js (LOGIN ONLY VERSION)

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/userModel"); // Ensure the path to userModel is correct

// NOTE: Register logic has been removed as per user request.

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    // Check if the user is authorized to log in (Optional, but good practice for officials)
    // if (user.role === 'user') {
    //     return res.status(403).json({ error: "Only officials can log in" });
    // }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user: { 
          id: user._id, 
          email: user.email, 
          name: user.name,
          role: user.role 
        } 
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ 
      token,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        role: user.role 
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// VERIFY TOKEN
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.user.id).select("-password");
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;