# HUKonnect

COMP3330_Group-project

A React Native mobile application for connecting students on the HU campus with a Node.js/Express backend and MongoDB database.

## 🚀 Features

- **User Authentication**: Secure user registration and login
- **Profile Management**: Create and customize user profiles
- **Groups**: Join or create study groups and clubs
- **Events**: Discover and attend campus events
- **Real-time Connection**: Connect with other students
- **Search & Discovery**: Find users, groups, and events

## 📱 Tech Stack

### Frontend (React Native)

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Styling**: StyleSheet API

### Backend (Node.js)

- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs

## 🛠️ Installation & Setup

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (local installation) - [Installation guide](https://docs.mongodb.com/manual/installation/)
- **MongoDB Compass** (for database management) - [Download here](https://www.mongodb.com/products/compass)
- **Expo CLI** (`npm install -g expo-cli`)
- **Git**

### 🔧 Backend Setup (Detailed)

#### 1. Navigate to Backend Directory

```bash
cd backend
```

#### 2. Install Dependencies

```bash
npm install
```

**Key Dependencies Installed:**

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `helmet` - Security headers
- `cors` - Cross-origin requests
- `express-rate-limit` - Rate limiting
- `express-validator` - Input validation

#### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env
```

**Update `.env` with your settings:**

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hukonnect
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
```

#### 4. Start MongoDB Service

```bash
# macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# Or check if already running
brew services list | grep mongodb
```

#### 5. Seed Database with Sample Data

```bash
npm run seed
```

**This creates:**

- 4 sample users (john@hu.edu, jane@hu.edu, mike@hu.edu, sarah@hu.edu)
- 3 sample groups (CS Study Group, Psychology Research Club, Entrepreneurship Network)
- 3 sample events (Tech Talk, Mental Health Workshop, Basketball Tournament)

#### 6. Start Backend Server

```bash
# Development mode (recommended)
npm run dev

# Or production mode
npm start
```

**✅ Backend will be running at:** `http://localhost:3000`

#### 7. Verify Backend Setup

Test the API connection:

```bash
curl http://localhost:3000/api/test
```

Expected response:

```json
{
  "message": "Backend connection successful!",
  "timestamp": "2025-09-29T...",
  "database": "connected"
}
```

### 📊 Database Management with MongoDB Compass

**✅ You're using MongoDB Compass - Perfect choice!**

#### Quick Connection:

1. **Launch MongoDB Compass**
2. **Connection String:** `mongodb://localhost:27017`
3. **Database:** `hukonnect`
4. **Collections:** `users`, `groups`, `events`

#### What You'll See:

- 👥 **Users Collection** (4 documents): Student profiles with majors, interests, joined groups
- 👨‍👩‍👧‍👦 **Groups Collection** (3 documents): Study groups with meeting schedules and member lists
- 📅 **Events Collection** (3 documents): Campus events with dates, locations, and attendee lists

**📖 See `COMPASS_GUIDE.md` for detailed database exploration instructions**

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the Expo development server:

```bash
npm start
```

4. Run on your device:

- **iOS Simulator**: Press `i` in the terminal or scan QR code with Camera app
- **Android Emulator**: Press `a` in the terminal or scan QR code with Expo Go app
- **Physical Device**: Install Expo Go app and scan the QR code

## 📚 API Endpoints

### 🔐 Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### 👤 User Management

- `GET /api/users/profile` - Get current user profile (requires auth)
- `PUT /api/users/profile` - Update user profile (requires auth)
- `GET /api/users/search` - Search users (requires auth)
- `GET /api/users/:id` - Get user by ID (requires auth)

### 👥 Group Management

- `GET /api/groups` - Get all public groups
- `POST /api/groups` - Create new group (requires auth)
- `GET /api/groups/:id` - Get group details
- `POST /api/groups/:id/join` - Join group (requires auth)
- `POST /api/groups/:id/leave` - Leave group (requires auth)
- `PUT /api/groups/:id` - Update group (admin only)
- `DELETE /api/groups/:id` - Delete group (admin only)

### 📅 Event Management

- `GET /api/events` - Get all public events
- `POST /api/events` - Create new event (requires auth)
- `GET /api/events/:id` - Get event details
- `POST /api/events/:id/join` - Join event (requires auth)
- `POST /api/events/:id/leave` - Leave event (requires auth)
- `PUT /api/events/:id` - Update event (organizer only)
- `DELETE /api/events/:id` - Delete event (organizer only)

### 🛠️ Admin Endpoints (Database Management)

- `GET /api/admin/stats` - Database statistics and counts
- `GET /api/admin/users` - All users with populated relationships
- `GET /api/admin/groups` - All groups with member details
- `GET /api/admin/events` - All events with attendee details
- `GET /api/admin/activity` - Recent activity summary
- `DELETE /api/admin/clear-all` - Clear all data (requires confirmation)

### 🧪 Testing & Health Check

- `GET /api/test` - Backend connection and database status test
- `GET /` - API info and version

## 🗂️ Project Structure

```
HUKonnect/
├── frontend/                 # React Native app
│   ├── app/                 # App screens and navigation
│   │   ├── (tabs)/         # Tab-based navigation
│   │   │   ├── index.tsx   # Home screen
│   │   │   └── explore.tsx # Explore screen
│   │   └── _layout.tsx     # Root layout
│   ├── package.json
│   ├── app.json           # Expo configuration
│   └── tsconfig.json      # TypeScript configuration
├── backend/                 # Node.js API server
│   ├── models/             # MongoDB models
│   │   ├── User.js
│   │   ├── Group.js
│   │   └── Event.js
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── groups.js
│   │   └── events.js
│   ├── middleware/         # Custom middleware
│   │   └── auth.js
│   ├── scripts/           # Utility scripts
│   │   └── seedDatabase.js
│   ├── server.js          # Express server setup
│   ├── package.json
│   └── .env.example       # Environment variables template
├── README.md
└── .gitignore
```

## 🧪 Sample Data

The project includes a database seeding script that creates sample users, groups, and events:

### Sample Users:

- `john@hu.edu` / `password123` - Computer Science Junior
- `jane@hu.edu` / `password123` - Psychology Senior
- `mike@hu.edu` / `password123` - Business Administration Sophomore
- `sarah@hu.edu` / `password123` - Biology Freshman

Run `npm run seed` in the backend directory to populate your database.

## 🔧 Development

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Code Style

This project follows standard JavaScript/TypeScript conventions. Consider using ESLint and Prettier for consistent code formatting.

## � Backend Troubleshooting

### Common Issues & Solutions

#### MongoDB Connection Issues

```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB if stopped
brew services start mongodb/brew/mongodb-community

# Test connection
mongosh mongodb://localhost:27017/hukonnect --eval "db.runCommand({connectionStatus : 1})"
```

#### Backend Server Issues

```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process on port 3000 (if needed)
kill -9 $(lsof -ti:3000)

# Restart backend server
npm run dev
```

#### Database Seeding Issues

```bash
# Clear existing data and re-seed
npm run seed

# Check if data was created
mongosh mongodb://localhost:27017/hukonnect --eval "
  console.log('Users:', db.users.countDocuments());
  console.log('Groups:', db.groups.countDocuments());
  console.log('Events:', db.events.countDocuments());
"
```

#### JWT Authentication Issues

- Ensure `JWT_SECRET` in `.env` is a long, random string
- Check token expiration in `JWT_EXPIRES_IN`
- Verify headers include `Authorization: Bearer <token>`

#### API Testing

```bash
# Test all admin endpoints
./test-database-api.sh

# Test specific endpoints
curl http://localhost:3000/api/admin/stats
curl http://localhost:3000/api/admin/users
curl http://localhost:3000/api/admin/groups
curl http://localhost:3000/api/admin/events
```

### Backend Log Monitoring

```bash
# Run with debug logging
DEBUG=* npm run dev

# Or run with nodemon for auto-restart
npm install -g nodemon
nodemon server.js
```

### Database Management Scripts

- `npm run seed` - Populate database with sample data
- `./check-database.sh` - Comprehensive database exploration
- `./test-database-api.sh` - Test all API endpoints

## �🚀 Deployment

### Backend Deployment

1. Set up MongoDB Atlas or your preferred database service
2. Update environment variables for production
3. Deploy to services like Heroku, Railway, or DigitalOcean

### Frontend Deployment

1. Build the Expo app for production:

```bash
expo build:android  # For Android
expo build:ios      # For iOS
```

2. Submit to app stores or deploy as web app

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
