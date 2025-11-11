const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    // Required only for local auth users. OAuth users may not have a username
    required: function() { return this.authProvider === 'local'; },
    unique: true,
    sparse: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  // Email (optional for legacy accounts) - used for login and linking
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
  },
  // Password hash (only used for local auth)
  password: {
    type: String,
    required: false,
  },
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  firstName: {
    type: String,
    required: false, // optional for OAuth users
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: false, // optional for OAuth users
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  major: {
    type: String,
    trim: true,
    maxlength: [100, 'Major cannot exceed 100 characters']
  },
  minor:{
    type: String,
    trim: true,
    maxlength: [100, 'Minor cannot exceed 100 characters']
  },
  birthDate: { 
    type: Date 
  },
  year: {
    type: String,
    enum: ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate', 'Other'],
    default: 'Freshman'
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  interests: [{
    type: String,
    trim: true
  }],
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  joinedGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  }],
  eventsAttending: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }]
  ,
  // Personal schedule: array of lightweight event objects saved by the user
  schedule: [{
    id: { type: String },
    title: { type: String, trim: true, maxlength: 200 },
    color: { type: String, trim: true },
    startMins: { type: Number, min: 0, max: 24 * 60 },
    endMins: { type: Number, min: 0, max: 24 * 60 },
    recurrence: { type: String, enum: ['once', 'weekly'], default: 'weekly' },
    dayIdx: { type: Number, min: 0, max: 6, required: false },
    date: { type: String, required: false }, // ISO date string for one-time events
  }],
}, {
  timestamps: true
});

// Index for better query performance and uniqueness
userSchema.index({ email: 1 }, { unique: true, sparse: true });
userSchema.index({ username: 1 }, { unique: true, sparse: true });

// Virtual field to get user age
userSchema.virtual("age").get(function () {
  if (!this.birthDate) return null;

  const today = new Date();
  const birthDate = new Date(this.birthDate);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  // 如果还没过生日，年龄减 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
});
userSchema.set("toJSON", { virtuals: true });

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
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);