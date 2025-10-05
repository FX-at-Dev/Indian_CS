// File: backend/models/User.js

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    // Yeh automatically 'createdAt' aur 'updatedAt' fields add kar dega
    timestamps: true 
});

const User = mongoose.model('User', UserSchema);

module.exports = User;