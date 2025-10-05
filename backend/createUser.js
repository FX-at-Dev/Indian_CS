// File: backend/createUser.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Apne User model ka path check kar lena
require('dotenv').config();

// --- YAHAN APNI DETAILS DAALO ---
const newUserEmail = 'testuser@gov.in';
const newUserPassword = 'Test@1234';
// ---------------------------------

const createAdminUser = async () => {
  try {
    // 1. Database se connect karo
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected...');

    // 2. Check karo ki user pehle se hai ya nahi
    const existingUser = await User.findOne({ email: newUserEmail });
    if (existingUser) {
      console.log('⚠️ User with this email already exists.');
      mongoose.disconnect();
      return;
    }

    // 3. Password ko hash karo
    const salt = await bcrypt.genSalt(10); // Salting for security
    const hashedPassword = await bcrypt.hash(newUserPassword, salt);
    console.log('🔒 Password hashed successfully.');

    // 4. Naya user banao
    const user = new User({
      email: newUserEmail,
      password: hashedPassword,
    });

    // 5. User ko database mein save karo
    await user.save();
    console.log(`✅ User '${newUserEmail}' created successfully!`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    // 6. Database connection band karo
    mongoose.disconnect();
    console.log('🔌 MongoDB disconnected.');
  }
};

createAdminUser();