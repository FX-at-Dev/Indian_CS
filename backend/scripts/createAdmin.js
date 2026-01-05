// File: backend/scripts/createAdmin.js
const bcrypt = require("bcryptjs");
const { User } = require("../models/userModel");
const mongo = require("../db/mongo");
require("dotenv").config();

async function createAdminUser() {
  try {
    await mongo.connect();
    console.log("Connected to MongoDB");

    const adminEmail = "testuser@gov.in";
    const adminPassword = "Test@1234";

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await User.create({
      name: "Government Official",
      email: adminEmail,
      password: hashedPassword,
      role: "government"
    });

    console.log("Admin user created successfully!");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
    
    process.exit(0);
  } catch (err) {
    console.error("Error creating admin:", err);
    process.exit(1);
  }
}

createAdminUser();