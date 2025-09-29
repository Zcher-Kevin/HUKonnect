# 🧭 MongoDB Compass Quick Guide for HUKonnect

## 🎯 **What You'll See in Compass**

### **Database: hukonnect**

📁 **Collections Overview:**

- 👥 **users** (4 documents) - Student profiles with authentication
- 👨‍👩‍👧‍👦 **groups** (3 documents) - Study groups and clubs
- 📅 **events** (3 documents) - Campus events and activities

---

## 📊 **Exploring Your Data**

### **Users Collection Sample:**

```json
{
  "_id": ObjectId("..."),
  "username": "john_doe",
  "email": "john@hu.edu",
  "firstName": "John",
  "lastName": "Doe",
  "major": "Computer Science",
  "year": "Junior",
  "bio": "Passionate about coding and technology...",
  "interests": ["Programming", "Gaming", "Music"],
  "joinedGroups": [ObjectId("..."), ObjectId("...")],
  "eventsAttending": [ObjectId("...")],
  "createdAt": "2025-09-28T..."
}
```

### **Groups Collection Sample:**

```json
{
  "_id": ObjectId("..."),
  "name": "CS Study Group",
  "description": "A group for Computer Science students to study together...",
  "category": "Study Group",
  "course": "COMP3330",
  "members": [ObjectId("..."), ObjectId("...")],
  "maxMembers": 15,
  "isPublic": true,
  "tags": ["programming", "algorithms", "data-structures"],
  "meetingSchedule": {
    "frequency": "Weekly",
    "dayOfWeek": "Wednesday",
    "time": "6:00 PM",
    "location": "Library Study Room 301"
  }
}
```

### **Events Collection Sample:**

```json
{
  "_id": ObjectId("..."),
  "title": "Tech Talk: AI and Machine Learning",
  "description": "Join us for an exciting presentation about the latest developments...",
  "category": "Academic",
  "location": "Computer Science Building Auditorium",
  "startDate": "2025-09-29T18:00:00.000Z",
  "endDate": "2025-09-29T20:00:00.000Z",
  "attendees": [ObjectId("..."), ObjectId("...")],
  "maxAttendees": 100,
  "isPublic": true,
  "tags": ["ai", "machine-learning", "tech"]
}
```

---

## 🔍 **Useful Compass Features**

### **1. Document View**

- Click on any collection to see all documents
- Navigate through documents with pagination
- View in Tree, Table, or JSON view

### **2. Query Builder**

- Filter documents: `{"major": "Computer Science"}`
- Find events by category: `{"category": "Academic"}`
- Search public groups: `{"isPublic": true}`

### **3. Aggregation Pipeline**

- Count users by major
- Group events by category
- Analyze membership patterns

### **4. Schema Analysis**

- View field types and distributions
- Identify data patterns
- Validate data consistency

### **5. Indexes**

- View current indexes
- Create new indexes for better performance
- Monitor query performance

---

## 🛠️ **Common Queries to Try**

### **Find All CS Students:**

```json
{ "major": "Computer Science" }
```

### **Find Public Events:**

```json
{ "isPublic": true }
```

### **Find Groups with Available Spots:**

- Use the Aggregation tab
- Match documents where memberCount < maxMembers

### **Users Attending Events:**

- Look at the `eventsAttending` array
- Use $lookup to join with events collection

---

## 💡 **Pro Tips**

1. **🔄 Real-time Updates**: Compass shows live data - refresh to see changes
2. **📝 Edit Documents**: Double-click any field to edit (be careful!)
3. **📊 Export Data**: Right-click collections to export as JSON/CSV
4. **🔍 Search**: Use the search bar for text searches across documents
5. **📈 Performance**: Check the Performance tab for query insights

---

## 🔗 **Backend Integration**

Your Express.js API endpoints correspond to these collections:

- `GET /api/users` → users collection
- `GET /api/groups` → groups collection
- `GET /api/events` → events collection
- `GET /api/admin/stats` → aggregated statistics

---

## ⚠️ **Safety Notes**

- **Read-Only Browsing**: Safe to explore and view data
- **Editing**: Be careful when editing documents directly
- **Backup First**: Consider backing up before major changes
- **Test Environment**: This is your development database

---

**🎉 Enjoy exploring your HUKonnect database visually in MongoDB Compass!**
