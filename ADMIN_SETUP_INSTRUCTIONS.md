# 🚀 Admin Panel Setup Instructions

## 📦 **Step-by-Step Dependency Installation**

The package.json has been reverted to the fresh Vite template. Now install dependencies one by one:

### **1. Navigate to admin folder**
```bash
cd admin
```

### **2. Install Production Dependencies**

```bash
# React Router for navigation
npm install react-router-dom

# Axios for API calls
npm install axios

# TanStack Table for data tables
npm install @tanstack/react-table

# React Icons
npm install react-icons

# Recharts for dashboard charts
npm install recharts
```

### **3. Install Development Dependencies**

```bash
# Tailwind CSS and dependencies
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind (already configured)
# npx tailwindcss init -p
```

### **4. Verify Installation**

After installing all dependencies, your `package.json` should look like:

```json
{
  "name": "admin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router-dom": "^6.x.x",
    "axios": "^1.x.x",
    "@tanstack/react-table": "^8.x.x",
    "react-icons": "^4.x.x",
    "recharts": "^2.x.x"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.4.0",
    "vite": "^8.0.1",
    "tailwindcss": "^3.x.x",
    "postcss": "^8.x.x",
    "autoprefixer": "^10.x.x"
  }
}
```

### **5. Start Development Server**

```bash
npm run dev
```

The admin panel should now run on `http://localhost:5173`

---

## 🔧 **Configuration Files Already Created**

✅ `tailwind.config.js` - Tailwind configuration
✅ `postcss.config.js` - PostCSS configuration
✅ `vite.config.js` - Vite configuration
✅ `src/index.css` - Tailwind directives and custom styles

---

## 📁 **Project Structure**

```
admin/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   └── MainLayout.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Loader.jsx
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── StatCard.jsx
│   │   ├── Table.jsx
│   │   └── Pagination.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   └── Users.jsx
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   │   ├── auth.js
│   │   └── formatters.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

---

## 🔑 **Create Admin User in MongoDB**

Before logging in, create an admin user:

```javascript
// In MongoDB Compass or shell:
db.users.insertOne({
  name: "Admin User",
  email: "admin@drugtrack.com",
  password_hash: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYPjYPuJ2Pu",
  role: "admin",
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true
})
```

**Login Credentials:**
- Email: `admin@drugtrack.com`
- Password: `admin123`

---

## ✅ **Verify Everything Works**

1. ✅ Backend running on `http://192.168.31.55:8001`
2. ✅ Admin panel running on `http://localhost:5173`
3. ✅ Login page loads
4. ✅ Can login with admin credentials
5. ✅ Dashboard shows statistics
6. ✅ Users page shows user list

---

## 🐛 **Troubleshooting**

### **Issue: Tailwind CSS not working**
```bash
# Reinstall Tailwind
npm install -D tailwindcss postcss autoprefixer
```

### **Issue: React Router not working**
```bash
# Reinstall React Router
npm install react-router-dom
```

### **Issue: API calls failing**
- Check backend is running on `http://192.168.31.55:8001`
- Check `src/services/api.js` has correct API_BASE_URL

### **Issue: Module not found errors**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 **Quick Install (All at Once)**

If you prefer to install all dependencies at once:

```bash
cd admin

# Install all production dependencies
npm install react-router-dom axios @tanstack/react-table react-icons recharts

# Install all dev dependencies
npm install -D tailwindcss postcss autoprefixer

# Start dev server
npm run dev
```

---

## 🎯 **Next Steps After Setup**

1. Test login functionality
2. Explore dashboard
3. Test users management page
4. Let me know if you want me to build the remaining 6 pages:
   - Owners
   - Customers
   - Drugs
   - Reports
   - Invitations
   - Scan Logs

---

**Ready to install dependencies!** 🚀
