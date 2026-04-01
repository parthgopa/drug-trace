# 🔑 Create Admin User for Login

## **Issue: 401 Unauthorized Error**

You're getting a 401 error because there's no admin user in the database yet.

---

## **Solution: Create Admin User in MongoDB**

### **Option 1: Using MongoDB Compass (Recommended)**

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `track-trace` database → `users` collection
4. Click "Add Data" → "Insert Document"
5. Paste this JSON:

```json
{
  "name": "Admin User",
  "email": "admin@drugtrack.com",
  "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYPjYPuJ2Pu",
  "role": "admin",
  "is_active": true,
  "created_at": {"$date": "2026-03-24T14:00:00.000Z"},
  "updated_at": {"$date": "2026-03-24T14:00:00.000Z"}
}
```

6. Click "Insert"

---

### **Option 2: Using MongoDB Shell**

```javascript
use track-trace

db.users.insertOne({
  name: "Admin User",
  email: "admin@drugtrack.com",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYPjYPuJ2Pu",
  role: "admin",
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
})
```

---

### **Option 3: Using Python Script**

Create a file `create_admin.py` in the backend folder:

```python
from pymongo import MongoClient
from datetime import datetime
import bcrypt

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['track-trace']

# Check if admin already exists
existing_admin = db.users.find_one({'email': 'admin@drugtrack.com'})
if existing_admin:
    print("Admin user already exists!")
else:
    # Create admin user
    admin_user = {
        'name': 'Admin User',
        'email': 'admin@drugtrack.com',
        'password_hash': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYPjYPuJ2Pu',
        'role': 'admin',
        'is_active': True,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    result = db.users.insert_one(admin_user)
    print(f"Admin user created successfully! ID: {result.inserted_id}")

client.close()
```

Run it:
```bash
cd backend
python create_admin.py
```

---

## **Login Credentials**

After creating the admin user, use these credentials to login:

- **Email:** `admin@drugtrack.com`
- **Password:** `admin123`

---

## **Verify Backend is Running**

Make sure your Flask backend is running on `http://localhost:8001`:

```bash
cd backend
python app.py
```

You should see:
```
 * Running on http://localhost:8001
```

---

## **Test Login**

1. Go to `http://localhost:5174` (admin panel)
2. Enter:
   - Email: `admin@drugtrack.com`
   - Password: `admin123`
3. Click "Sign In"

You should be redirected to the dashboard!

---

## **Troubleshooting**

### **Still getting 401?**

Check backend logs for the exact error. Common issues:

1. **Wrong database name** - Make sure backend is using `track-trace` database
2. **Password hash mismatch** - Use the exact hash provided above
3. **Backend not running** - Check `http://localhost:8001/auth/login` is accessible
4. **CORS issues** - Backend should have CORS enabled for `http://localhost:5174`

### **Check if user was created:**

In MongoDB shell:
```javascript
use track-trace
db.users.find({email: "admin@drugtrack.com"})
```

You should see the admin user document.

---

**After creating the admin user, try logging in again!** 🚀
