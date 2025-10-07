# HUKonnect Backend

Node.js REST API server built with Express.js for the HUKonnect campus connection platform.

## 🚀 Tech Stack

- **Runtime**: Node.js (v16+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs
- **Development**: Nodemon for auto-reload

## 🏗️ Project Structure

```
backend/
├── models/                      # MongoDB data models
│   ├── User.js                 # User schema and methods
│   ├── Group.js                # Study group schema
│   └── Event.js                # Campus event schema
├── routes/                     # Express route handlers
│   ├── auth.js                 # Authentication endpoints
│   ├── users.js                # User management
│   ├── groups.js               # Group operations
│   └── events.js               # Event operations
├── middleware/                 # Custom middleware
│   └── auth.js                 # JWT authentication middleware
├── scripts/                    # Utility scripts
│   └── seedDatabase.js         # Database seeding
├── server.js                   # Express server setup
├── package.json                # Dependencies and scripts
├── .env.example                # Environment variables template
└── README.md                   # This file
```

Hello 
## 🛠️ Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/hukonnect
# JWT_SECRET=your-super-secret-key-here

# Seed database with sample data (optional)
npm run seed

# Start development server
npm run dev
```

## 🌐 API Endpoints

### Authentication

```
POST   /api/auth/register      # Register new user
POST   /api/auth/login         # User login
GET    /api/auth/verify        # Verify JWT token
```

### Users

```
GET    /api/users/profile      # Get current user profile
PUT    /api/users/profile      # Update user profile
GET    /api/users/search       # Search users
GET    /api/users/:id          # Get user by ID
```

### Groups

```
GET    /api/groups            # Get all groups
POST   /api/groups            # Create new group
GET    /api/groups/:id        # Get group by ID
POST   /api/groups/:id/join   # Join group
POST   /api/groups/:id/leave  # Leave group
```

### Events

```
GET    /api/events            # Get all events
POST   /api/events            # Create new event
GET    /api/events/:id        # Get event by ID
POST   /api/events/:id/join   # Join event
POST   /api/events/:id/leave  # Leave event
```

### Utility

```
GET    /                      # API status
GET    /api/test              # Backend connection test
```

## 📊 Data Models

### User Model

```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  major: String,
  year: String,
  bio: String,
  interests: [String],
  profilePicture: String,
  isActive: Boolean,
  lastLogin: Date,
  joinedGroups: [ObjectId],
  eventsAttending: [ObjectId]
}
```

### Group Model

```javascript
{
  name: String,
  description: String,
  creator: ObjectId,
  category: String,
  course: String,
  members: [{
    user: ObjectId,
    role: String,
    joinedAt: Date
  }],
  maxMembers: Number,
  isPublic: Boolean,
  tags: [String],
  meetingSchedule: {
    frequency: String,
    dayOfWeek: String,
    time: String,
    location: String
  }
}
```

### Event Model

```javascript
{
  title: String,
  description: String,
  organizer: ObjectId,
  location: String,
  startDate: Date,
  endDate: Date,
  category: String,
  maxAttendees: Number,
  attendees: [ObjectId],
  tags: [String],
  isPublic: Boolean,
  imageUrl: String,
  requirements: String
}
```

## 🔐 Authentication & Security

### JWT Authentication

```javascript
// JWT token structure
{
  userId: ObjectId,
  iat: Number,
  exp: Number
}
```

### Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Express Validator
- **Password Hashing**: bcryptjs with salt rounds
- **Environment Variables**: Sensitive data protection

### Protected Routes

All routes except `/api/auth/*` and `/api/test` require authentication:

```javascript
// Authorization header required
Authorization: Bearer <jwt_token>
```

## 🚧 Available Scripts

```bash
npm start              # Start production server
npm run dev           # Start development server with nodemon
npm test              # Run Jest tests
npm run seed          # Populate database with sample data
```

## 🗃️ Database Setup

### Local MongoDB

```bash
# Install MongoDB
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Connect to MongoDB
mongo mongodb://localhost:27017/hukonnect
```

### MongoDB Atlas (Cloud)

```bash
# Update .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hukonnect
```

### Sample Data

```bash
# Seed database with test data
npm run seed

# Creates 4 sample users:
# john@hu.edu / password123
# jane@hu.edu / password123
# mike@hu.edu / password123
# sarah@hu.edu / password123
```

## 📡 API Usage Examples

### Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@hu.edu",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "major": "Computer Science",
    "year": "Junior"
  }'
```

### Login User

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@hu.edu",
    "password": "password123"
  }'
```

### Get User Profile (with JWT)

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Create Study Group

```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "CS Study Group",
    "description": "Weekly computer science study sessions",
    "category": "Study Group",
    "course": "COMP3330",
    "maxMembers": 15
  }'
```

## ⚙️ Environment Configuration

### .env Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hukonnect

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRES_IN=7d

# API Configuration
API_URL=http://localhost:3000
```

## 🔧 Middleware

### Authentication Middleware

```javascript
// Protects routes requiring authentication
const auth = require("./middleware/auth");
router.get("/profile", auth, getUserProfile);
```

### Error Handling

```javascript
// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});
```

### Request Validation

```javascript
// Input validation example
const { body, validationResult } = require("express-validator");

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    // ... validation middleware
  ],
  registerUser
);
```

## 📈 Performance & Monitoring

### Features

- **Compression**: Response compression middleware
- **Request Logging**: HTTP request logging
- **Error Tracking**: Comprehensive error handling
- **Database Indexing**: Optimized queries

### Monitoring

```bash
# Check server status
curl http://localhost:3000/

# Test database connection
curl http://localhost:3000/api/test

# Monitor logs
npm run dev # Shows real-time logs
```

## 🧪 Testing

### API Testing with curl

```bash
# Test server health
curl http://localhost:3000/api/test

# Test user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@hu.edu","password":"test123","firstName":"Test","lastName":"User"}'
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables
3. Use collection for comprehensive testing

## 🚀 Deployment

### Production Setup

```bash
# Set production environment
NODE_ENV=production

# Use process manager
npm install -g pm2
pm2 start server.js --name "hukonnect-api"

# Or use Docker
docker build -t hukonnect-backend .
docker run -p 3000:3000 hukonnect-backend
```

### Cloud Deployment Options

- **Heroku**: Easy deployment with MongoDB Atlas
- **Railway**: Simple Node.js deployment
- **DigitalOcean**: VPS with MongoDB
- **AWS**: EC2 with RDS/DocumentDB
- **Vercel**: Serverless functions

### Docker Configuration

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection:**

```bash
# Check MongoDB status
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb-community
```

**Port Issues:**

```bash
# Check what's running on port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

**JWT Issues:**

- Verify JWT_SECRET in .env
- Check token expiration
- Ensure proper Authorization header format

**CORS Issues:**

- Check frontend URL in CORS configuration
- Verify request headers
- Update allowed origins in server.js

## 📊 Database Management

### Useful MongoDB Commands

```javascript
// Connect to database
use hukonnect

// View collections
show collections

// Count documents
db.users.countDocuments()
db.groups.countDocuments()
db.events.countDocuments()

// Find documents
db.users.find().limit(5)
db.groups.find({category: "Study Group"})

// Create indexes
db.users.createIndex({email: 1})
db.events.createIndex({startDate: 1})
```

### Backup & Restore

```bash
# Backup database
mongodump --db hukonnect --out backup/

# Restore database
mongorestore --db hukonnect backup/hukonnect/
```

## 🔒 Security Best Practices

- **Environment Variables**: Never commit .env files
- **JWT Secrets**: Use strong, unique secrets
- **Password Hashing**: Always hash passwords
- **Input Validation**: Validate all user inputs
- **Rate Limiting**: Prevent abuse
- **HTTPS**: Use SSL/TLS in production
- **CORS**: Configure properly for security

## 📚 API Documentation

### Response Format

```javascript
// Success Response
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors */ ]
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 🤝 Contributing

1. Follow RESTful API conventions
2. Use proper HTTP status codes
3. Implement comprehensive error handling
4. Add input validation for all endpoints
5. Update documentation for new features
6. Write tests for new functionality

## 📄 License

This project is part of COMP3330 Group Project. All rights reserved.
