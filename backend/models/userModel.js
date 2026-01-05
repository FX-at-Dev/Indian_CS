// File: backend/models/userModel.js
const { mongoose } = require('../db/mongo');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    index: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: {
    type: String,
    enum: ['user', 'government', 'admin'],
    default: 'user',
    index: true
  }
}, { 
  timestamps: true 
});

// Prevent password from being returned in queries
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = { User };