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

    // Create sample users
    const users = await User.create([
      {
        username: 'john_doe',
        email: 'john@hu.edu',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        major: 'Computer Science',
        minor: 'Mathematics',
        birthDate: new Date('2001-05-15'),
        year: 'Junior',
        bio: 'Passionate about coding and technology. Love to help others learn programming.',
        interests: ['Programming', 'Gaming', 'Music']
      },
      {
        username: 'jane_smith',
        email: 'jane@hu.edu',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        major: 'Psychology',
        minor: 'Sociology',
        birthDate: new Date('2002-08-22'),
        year: 'Senior',
        bio: 'Psychology major interested in human behavior and mental health.',
        interests: ['Psychology', 'Reading', 'Yoga']
      },
      {
        username: 'mike_johnson',
        email: 'mike@hu.edu',
        password: 'password123',
        firstName: 'Mike',
        lastName: 'Johnson',
        major: 'Business Administration',
        minor: 'Economics',
        birthDate: new Date('2000-11-30'),
        year: 'Sophomore',
        bio: 'Future entrepreneur looking to network with like-minded individuals.',
        interests: ['Business', 'Networking', 'Sports']
      },
      {
        username: 'sarah_wilson',
        email: 'sarah@hu.edu',
        password: 'password123',
        firstName: 'Sarah',
        lastName: 'Wilson',
        major: 'Biology',
        minor: 'Chemistry',
        birthDate: new Date('2001-02-10'),
        year: 'Freshman',
        bio: 'Pre-med student passionate about healthcare and research.',
        interests: ['Medicine', 'Research', 'Volunteering']
      }
    ]);

    // Example user with optional fields omitted (no email, no lastName)
    const optionalUser = await User.create({
      username: 'alex_optional',
      password: 'password123',
      firstName: 'Alex',
      // lastName omitted intentionally to show it's optional
      major: 'Undeclared',
      birthDate: new Date('2003-07-01'),
      year: 'Freshman',
      bio: 'Optional fields demo user',
      interests: ['Clubs']
    });

    users.push(optionalUser);

    console.log('Created sample users');

    // Create sample groups
    const groups = await Group.create([
      {
        name: 'CS Study Group',
        description: 'A group for Computer Science students to study together and work on projects.',
        creator: users[0]._id,
        category: 'Study Group',
        course: 'COMP3330',
        members: [
          { user: users[0]._id, role: 'admin' },
          { user: users[2]._id, role: 'member' }
        ],
        maxMembers: 15,
        tags: ['programming', 'algorithms', 'data-structures'],
        meetingSchedule: {
          frequency: 'Weekly',
          dayOfWeek: 'Wednesday',
          time: '6:00 PM',
          location: 'Library Study Room 301'
        }
      },
      {
        name: 'Psychology Research Club',
        description: 'Join us to discuss latest research in psychology and participate in studies.',
        creator: users[1]._id,
        category: 'Club',
        members: [
          { user: users[1]._id, role: 'admin' },
          { user: users[3]._id, role: 'member' }
        ],
        maxMembers: 20,
        tags: ['psychology', 'research', 'mental-health'],
        meetingSchedule: {
          frequency: 'Bi-weekly',
          dayOfWeek: 'Friday',
          time: '4:00 PM',
          location: 'Psychology Building Room 205'
        }
      },
      {
        name: 'Entrepreneurship Network',
        description: 'Connect with aspiring entrepreneurs and business leaders on campus.',
        creator: users[2]._id,
        category: 'Professional',
        members: [
          { user: users[2]._id, role: 'admin' },
          { user: users[0]._id, role: 'member' }
        ],
        maxMembers: 25,
        tags: ['business', 'entrepreneurship', 'networking'],
        meetingSchedule: {
          frequency: 'Monthly',
          dayOfWeek: 'Thursday',
          time: '7:00 PM',
          location: 'Business Building Conference Room'
        }
      }
    ]);

    console.log('Created sample groups');

    // Update users with joined groups
    await User.findByIdAndUpdate(users[0]._id, {
      $push: { joinedGroups: { $each: [groups[0]._id, groups[2]._id] } }
    });
    await User.findByIdAndUpdate(users[1]._id, {
      $push: { joinedGroups: groups[1]._id }
    });
    await User.findByIdAndUpdate(users[2]._id, {
      $push: { joinedGroups: { $each: [groups[0]._id, groups[2]._id] } }
    });
    await User.findByIdAndUpdate(users[3]._id, {
      $push: { joinedGroups: groups[1]._id }
    });

    // Create sample events
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(14, 0, 0, 0);

    const events = await Event.create([
      {
        title: 'Tech Talk: AI and Machine Learning',
        description: 'Join us for an exciting presentation about the latest developments in AI and ML.',
        organizer: users[0]._id,
        location: 'Computer Science Building Auditorium',
        startDate: tomorrow,
        endDate: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
        category: 'Academic',
        maxAttendees: 100,
        attendees: [users[1]._id, users[2]._id],
        tags: ['ai', 'machine-learning', 'tech'],
        imageUrl: null,
        requirements: 'No prerequisites required'
      },
      {
        title: 'Campus Mental Health Workshop',
        description: 'Learn about mental health resources and coping strategies for college students.',
        organizer: users[1]._id,
        location: 'Student Union Building Room 150',
        startDate: nextWeek,
        endDate: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000), // 3 hours later
        category: 'Social',
        maxAttendees: 50,
        attendees: [users[3]._id],
        tags: ['mental-health', 'wellness', 'workshop'],
        imageUrl: null,
        requirements: 'Open to all students'
      },
      {
        title: 'Basketball Tournament',
        description: 'Annual intramural basketball tournament. Form your teams and compete!',
        organizer: users[2]._id,
        location: 'University Gymnasium',
        startDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days after nextWeek
        endDate: new Date(nextWeek.getTime() + 2 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 6 hours later
        category: 'Sports',
        maxAttendees: 200,
        attendees: [users[0]._id, users[3]._id],
        tags: ['basketball', 'sports', 'tournament'],
        imageUrl: null,
        requirements: 'Must have valid student ID'
      }
    ]);

    console.log('Created sample events');

    // Update users with events they're attending
    await User.findByIdAndUpdate(users[0]._id, {
      $push: { eventsAttending: events[2]._id }
    });
    await User.findByIdAndUpdate(users[1]._id, {
      $push: { eventsAttending: events[0]._id }
    });
    await User.findByIdAndUpdate(users[2]._id, {
      $push: { eventsAttending: events[0]._id }
    });
    await User.findByIdAndUpdate(users[3]._id, {
      $push: { eventsAttending: { $each: [events[1]._id, events[2]._id] } }
    });

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