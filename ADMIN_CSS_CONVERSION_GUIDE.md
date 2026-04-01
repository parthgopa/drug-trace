# 🎨 Admin Panel - CSS Conversion Guide

## ✅ **COMPLETED**

1. ✅ Removed Tailwind CSS dependencies
2. ✅ Created comprehensive CSS files:
   - `src/index.css` - CSS variables and reset
   - `src/styles/layout.css` - Layout components (header, sidebar, footer, grid)
   - `src/styles/components.css` - Reusable components (buttons, inputs, cards, tables, badges)
3. ✅ Updated `main.jsx` to import all CSS files
4. ✅ Updated `vite.config.js` to remove Tailwind plugin

---

## 📋 **CSS CLASS REFERENCE**

### **Buttons**
```jsx
<button className="btn btn-primary btn-md">Primary Button</button>
<button className="btn btn-secondary btn-sm">Secondary</button>
<button className="btn btn-success btn-lg">Success</button>
<button className="btn btn-danger">Danger</button>
<button className="btn btn-outline">Outline</button>
```

### **Inputs**
```jsx
<div className="input-group">
  <label className="input-label">
    Email <span className="required">*</span>
  </label>
  <div className="input-wrapper">
    <span className="input-icon"><FiMail /></span>
    <input className="input has-icon" type="email" />
  </div>
  <span className="input-error">Error message</span>
</div>
```

### **Cards**
```jsx
<div className="card">
  <div className="card-header">
    <h3 className="card-title">Title</h3>
  </div>
  <div className="card-body">Content</div>
  <div className="card-footer">
    <button className="btn btn-secondary">Cancel</button>
    <button className="btn btn-primary">Save</button>
  </div>
</div>
```

### **Tables**
```jsx
<div className="table-container">
  <table className="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
      </tr>
    </tbody>
  </table>
</div>
```

### **Badges**
```jsx
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Inactive</span>
<span className="badge badge-admin">Admin</span>
<span className="badge badge-owner">Owner</span>
```

### **Layout**
```jsx
<div className="app-container">
  <aside className="sidebar">...</aside>
  <div className="main-content">
    <header className="header">...</header>
    <main className="page-content">
      <div className="page-header">
        <div className="page-header-text">
          <h1>Page Title</h1>
          <p>Description</p>
        </div>
      </div>
      {/* Content */}
    </main>
    <footer className="footer">...</footer>
  </div>
</div>
```

### **Grid**
```jsx
<div className="grid grid-cols-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

### **Stat Cards**
```jsx
<div className="stat-card">
  <div className="stat-card-content">
    <div className="stat-card-info">
      <p className="stat-card-title">Total Users</p>
      <p className="stat-card-value">1,234</p>
    </div>
    <div className="stat-card-icon blue">
      <FiUsers size={24} />
    </div>
  </div>
</div>
```

---

## 🔄 **CONVERSION TASKS**

### **Phase 1: Convert Existing Pages** ⏳

All existing pages need to be converted from Tailwind classes to the new CSS classes:

1. **Login.jsx** - Replace all Tailwind classes with CSS classes
2. **Dashboard.jsx** - Replace all Tailwind classes with CSS classes  
3. **Users.jsx** - Replace all Tailwind classes with CSS classes

### **Phase 2: Convert Components** ⏳

All components need to be converted:

1. **Button.jsx** - Use CSS classes instead of Tailwind
2. **Input.jsx** - Use CSS classes instead of Tailwind
3. **Modal.jsx** - Use CSS classes instead of Tailwind
4. **Table.jsx** - Use CSS classes instead of Tailwind
5. **Pagination.jsx** - Use CSS classes instead of Tailwind
6. **StatCard.jsx** - Use CSS classes instead of Tailwind
7. **Loader.jsx** - Use CSS classes instead of Tailwind
8. **Header.jsx** - Use CSS classes instead of Tailwind
9. **Sidebar.jsx** - Use CSS classes instead of Tailwind
10. **Footer.jsx** - Use CSS classes instead of Tailwind

### **Phase 3: Build Remaining Pages** ⏳

Build the 6 remaining pages using CSS classes:

1. **Owners.jsx**
2. **Customers.jsx**
3. **Drugs.jsx**
4. **Reports.jsx**
5. **Invitations.jsx**
6. **Scans.jsx**

---

## 📝 **CONVERSION EXAMPLE**

### **Before (Tailwind):**
```jsx
<button className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
  Click Me
</button>
```

### **After (CSS Classes):**
```jsx
<button className="btn btn-primary btn-md">
  Click Me
</button>
```

---

## 🎯 **NEXT STEPS**

1. **Test the app** - Run `npm run dev` and check if it loads
2. **Convert Login page** - Replace Tailwind classes with CSS classes
3. **Convert Dashboard page** - Replace Tailwind classes with CSS classes
4. **Convert Users page** - Replace Tailwind classes with CSS classes
5. **Convert all components** - Replace Tailwind classes in all component files
6. **Build remaining 6 pages** - Using the new CSS classes

---

## 💡 **IMPORTANT NOTES**

- All CSS variables are defined in `src/index.css`
- Layout styles are in `src/styles/layout.css`
- Component styles are in `src/styles/components.css`
- Use semantic class names (e.g., `btn-primary` instead of `bg-blue-600`)
- All styles are responsive and follow the same design system
- Colors, spacing, and shadows are consistent via CSS variables

---

**The CSS framework is ready! Now we need to convert the existing pages and components to use these CSS classes instead of Tailwind.** 🚀

Would you like me to:
1. Start converting the Login page first?
2. Convert all pages at once?
3. Provide you with the conversion mappings so you can review?
