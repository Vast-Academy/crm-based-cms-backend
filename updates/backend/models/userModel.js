const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  phone: String,
  role: {
    type: String,
    enum: ['admin', 'manager', 'technician'],
    required: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  location: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  activeManagerStatus: {
    type: String,
    enum: ['active', 'pending', 'transferring', 'transferred'],
    default: function() {
      return this.role === 'manager' ? 'active' : undefined;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});
// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
 
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
// Method to check password
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
const userModel = mongoose.model('User', UserSchema);
module.exports = userModel;