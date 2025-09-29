~# 🗄️ HUKonnect Database Management Guide

## 📊 **Current Database Status**

Your HUKonnect database is successfully set up with sample data:

- **4 Users**: Computer Science, Psychology, Business Administration, and Biology students
- **3 Groups**: CS Study Group, Psychology Research Club, Entrepreneurship Network
- **3 Events**: Tech Talk, Mental Health Workshop, Basketball Tournament

---

## 🔧 **Methods to Check Database Data**

### **Method 1: MongoDB Shell (Command Line)**

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/hukonnect

# Basic queries
db.users.find().pretty()
db.groups.find().pretty()
db.events.find().pretty()

# Count documents
db.users.countDocuments()
db.groups.countDocuments()
db.events.countDocuments()

# Complex queries
db.users.find({"major": "Computer Science"})
db.groups.find({"category": "Study Group"})
db.events.find({"isPublic": true})

# Aggregation examples
db.users.aggregate([
  { $group: { _id: "$major", count: { $sum: 1 } } }
])
```

### **Method 2: Quick Database Check Script**

Run the automated database explorer:

```bash
# Run comprehensive database check
./check-database.sh

# Test API endpoints
./test-database-api.sh
```

### **Method 3: Backend API Endpoints**

**Prerequisites**: Make sure your backend server is running (`node server.js`)

```bash
# Database statistics
curl http://localhost:3000/api/admin/stats

# All users (without passwords)
curl http://localhost:3000/api/admin/users

# All groups with member details
curl http://localhost:3000/api/admin/groups

# All events with attendee details
curl http://localhost:3000/api/admin/events

# Recent activity summary
curl http://localhost:3000/api/admin/activity
```

### **Method 4: MongoDB Compass (GUI) ⭐ INSTALLED**

**Quick Setup:**

1. **🚀 Launch MongoDB Compass**
2. **🔗 Connection String**: `mongodb://localhost:27017`
3. **📂 Database**: Select `hukonnect`
4. **📋 Collections**: Explore `users` (4), `groups` (3), `events` (3)

**What You'll See:**

- 👥 **Users**: John Doe (CS), Jane Smith (Psychology), Mike Johnson (Business), Sarah Wilson (Biology)
- 👨‍👩‍👧‍👦 **Groups**: CS Study Group, Psychology Research Club, Entrepreneurship Network
- 📅 **Events**: Tech Talk, Mental Health Workshop, Basketball Tournament

**Key Features:**

- 🎨 Visual document browsing
- 🔍 Query builder with filters
- ✏️ Document editor
- 📊 Schema analysis
- 📈 Performance insights
- 📤 Export/Import data

**📖 See `COMPASS_GUIDE.md` for detailed usage instructions**

### **Method 5: VS Code Extension**

1. **Install Extension**: "MongoDB for VS Code"
2. **Connect**: `mongodb://localhost:27017`
3. **Browse collections** directly in VS Code
4. **Run queries** with syntax highlighting

---

## 📱 **Frontend Integration**

Your React Native app can also display database data:

1. **Test Backend Connection** button shows API connectivity
2. **User Authentication** endpoints are ready
3. **Real-time data** fetching is configured

---

## 🛠️ **Database Operations**

### **Add Sample Data**

```bash
cd backend && npm run seed
```

### **Clear All Data** ⚠️

```bash
curl -X DELETE http://localhost:3000/api/admin/clear-all \
  -H "Content-Type: application/json" \
  -d '{"confirm": "YES_DELETE_ALL"}'
```

### **Backup Database**

```bash
mongodump --db hukonnect --out ./backup/
```

### **Restore Database**

```bash
mongorestore --db hukonnect ./backup/hukonnect/
```

---

## 📈 **Database Schema Overview**

### **Users Collection**

- Personal info (name, email, major, year)
- Authentication (hashed passwords)
- Preferences (interests, bio)
- Relationships (joined groups, events attending)

### **Groups Collection**

- Group details (name, description, category)
- Membership (members, admin, max capacity)
- Settings (public/private, course code)
- Meeting schedule and location

### **Events Collection**

- Event info (title, description, category)
- Timing (start/end dates)
- Capacity (max attendees, current count)
- Requirements and tags

---

## 🔐 **Security Notes**

- Passwords are hashed using bcryptjs
- API endpoints include rate limiting
- CORS is configured for development
- Helmet provides security headers
- Input validation on all endpoints

---

## 🚀 **Next Steps**

1. **Explore with MongoDB Compass** for visual database management
2. **Test API endpoints** in Postman or browser
3. **Use the mobile app** to interact with data
4. **Add more sample data** as needed
5. **Set up database indexes** for better performance

---

## 🆘 **Troubleshooting**

**Database Connection Issues:**

```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Check database status
mongosh --eval "db.runCommand({connectionStatus : 1})"
```

**API Issues:**

```bash
# Check if backend server is running
lsof -i :3000

# Restart backend
cd backend && node server.js
```

**Data Seeding Issues:**

```bash
# Re-run seeding script
cd backend && npm run seed
```
