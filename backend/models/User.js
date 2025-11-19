const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() { return this.authProvider === 'local'; },
    unique: true,
    sparse: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  password: {
    type: String,
    required: false,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  yearOfStudy: {
    type: String,
    enum: ['one', 'two', 'three', 'four', 'master', 'phd', 'other'],
    default: 'one'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastlogin: {
    type: Date,
    default: null
  },
  schedule: [{
    id: { type: String },
    title: { type: String, trim: true, maxlength: 200 },
    color: { type: String, trim: true },
    startMins: { type: Number, min: 0, max: 24 * 60 },
    endMins: { type: Number, min: 0, max: 24 * 60 },
    recurrence: { type: String, enum: ['once', 'weekly'], default: 'weekly' },
    dayIdx: { type: Number, min: 0, max: 6, required: false },
    date: { type: String, required: false },
  }],
  major: {
    type: String,
    trim: true,
    maxlength: [100, 'Major cannot exceed 100 characters']
  },
  minor: {
    type: String,
    trim: true,
    maxlength: [100, 'Minor cannot exceed 100 characters']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'other', 'unspecified'],
    default: 'unspecified'
  },
  birthdate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for better query performance and uniqueness
// Indexes are declared on the path definitions (unique: true + sparse: true)
// Avoid duplicate index declarations (either use `index()` or `unique` on the field)
// so we don't trigger Mongoose duplicate index warnings.

// Virtual field to get user age
// No virtuals exposed by default - keep the schema minimal and explicit.

// Hash password before saving (only for local auth)
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified AND it's a local auth user
  if (!this.isModified('password') || this.authProvider !== 'local' || !this.password) {
    return next();
  }
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get public profile (exclude sensitive data)
userSchema.methods.toPublicJSON = function() {
  // Only expose the permitted public fields
  const u = this.toObject({ getters: true });
  const publicFields = {
    _id: u._id,
    username: u.username,
    email: u.email,
    authProvider: u.authProvider,
    firstName: u.firstName,
    lastName: u.lastName,
    yearOfStudy: u.yearOfStudy,
    isActive: u.isActive,
    lastlogin: u.lastlogin,
    schedule: u.schedule || [],
    gender: u.gender,
    major: u.major,
    minor: u.minor,
    birthdate: u.birthdate,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
  return publicFields;
};

module.exports = mongoose.model('User', userSchema);