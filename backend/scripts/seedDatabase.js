const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Event = require('../models/Event');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hukonnect';

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Group.deleteMany({});
    await Event.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users (minimal fields matching the current User model)
    const users = await User.create([
      {
        username: 'john_doe',
        email: 'john@hu.edu',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        major: 'Computer Science',
        minor: 'Mathematics',
        birthdate: new Date('2001-05-15'),
        yearOfStudy: 'three'
      },
      {
        username: 'jane_smith',
        email: 'jane@hu.edu',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        major: 'Psychology',
        minor: 'Sociology',
        birthdate: new Date('2002-08-22'),
        yearOfStudy: 'four'
      },
      {
        username: 'mike_johnson',
        email: 'mike@hu.edu',
        password: 'password123',
        firstName: 'Mike',
        lastName: 'Johnson',
        gender: 'male',
        major: 'Business Administration',
        minor: 'Economics',
        birthdate: new Date('2000-11-30'),
        yearOfStudy: 'two'
      },
      {
        username: 'sarah_wilson',
        email: 'sarah@hu.edu',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Wilson',
        gender: 'female',
        major: 'Biology',
        minor: 'Chemistry',
        birthdate: new Date('2001-02-10'),
        yearOfStudy: 'one'
      }
    ]);

    console.log('Database seeded successfully!');
    console.log('Sample users created:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Password: password123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();