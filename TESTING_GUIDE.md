# Complete Testing Guide - Role-Based Supply Chain System

## 🧪 **COMPREHENSIVE TESTING WORKFLOW**

This guide covers testing all features of the role-based supply chain tracking system with geo-location.

---

## 📋 **PRE-REQUISITES**

### **1. Backend Setup**
```bash
cd backend
pip install -r requirements.txt
python app.py
```
**Expected Output:**
```
* Running on http://0.0.0.0:5000
* Debugger is active!
```

### **2. Frontend Setup**
```bash
cd frontend-new
npm install
npx expo start
```
**Expected Output:**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### **3. Database**
- MongoDB should be running on `mongodb://localhost:27017`
- Database name: `drug_trace`
- Collections will be auto-created

---

## 🎯 **TESTING WORKFLOW**

### **PHASE 1: Owner Registration & Setup**

#### **Test 1.1: Owner Signup**
**Steps:**
1. Open app → Navigate to Signup screen
2. Select **"Owner"** role (3rd button)
3. Fill in:
   - Name: `John Owner`
   - Email: `owner@company.com`
   - Password: `owner123`
   - Confirm Password: `owner123`
   - Company Name: `ABC Pharmaceuticals`
4. Click **"Create Account"**

**Expected Result:**
- ✅ Success alert: "Account created successfully!"
- ✅ Auto-login and redirect to Owner Dashboard
- ✅ Dashboard shows: "Hello, John Owner"
- ✅ Statistics cards display (all zeros initially)

**Backend Verification:**
```bash
# Check MongoDB
use drug_trace
db.users.find({email: "owner@company.com"})
```
**Expected:**
```json
{
  "name": "John Owner",
  "email": "owner@company.com",
  "role": "owner",
  "company_name": "ABC Pharmaceuticals",
  "is_active": true
}
```

---

### **PHASE 2: Invitation System**

#### **Test 2.1: Send Manufacturer Invitation**
**Steps:**
1. On Owner Dashboard → Click **"Send Invitation"** button
2. Fill in modal:
   - Email: `manufacturer@pharma.com`
   - Role: Select **"Manufacturer"**
   - Company Name: `XYZ Pharma Ltd`
3. Click **"Send Invitation"**

**Expected Result:**
- ✅ Success alert: "Invitation sent to manufacturer@pharma.com"
- ✅ Modal closes
- ✅ Recent Invitations section shows new invitation
- ✅ Status badge: "PENDING" (yellow)

**Backend Verification:**
```bash
db.invitations.find({email: "manufacturer@pharma.com"})
```
**Expected:**
```json
{
  "email": "manufacturer@pharma.com",
  "role": "manufacturer",
  "invited_by": "owner_user_id",
  "company_name": "XYZ Pharma Ltd",
  "status": "pending"
}
```

---

#### **Test 2.2: Send Distributor Invitation**
**Steps:**
1. Click **"Send Invitation"** again
2. Fill in:
   - Email: `distributor@logistics.com`
   - Role: Select **"Distributor"**
   - Company Name: `Fast Logistics Inc`
3. Click **"Send Invitation"**

**Expected Result:**
- ✅ Success alert
- ✅ Invitation appears in list

---

#### **Test 2.3: Send Retailer Invitation**
**Steps:**
1. Click **"Send Invitation"** again
2. Fill in:
   - Email: `retailer@pharmacy.com`
   - Role: Select **"Retailer"**
   - Company Name: `HealthMart Pharmacy`
3. Click **"Send Invitation"**

**Expected Result:**
- ✅ Success alert
- ✅ Invitation appears in list

---

#### **Test 2.4: View All Invitations**
**Steps:**
1. Click **"Manage Invitations"** from Quick Actions
2. Verify all 3 invitations are listed
3. Test search: Type "pharma"
4. Test filter: Click "Pending" tab

**Expected Result:**
- ✅ All invitations visible
- ✅ Search filters correctly
- ✅ Filter tabs show correct counts
- ✅ Pull-to-refresh works

---

### **PHASE 3: Invited User Password Setup**

#### **Test 3.1: Manufacturer Password Setup**
**Steps:**
1. **Logout** from Owner account
2. On Login screen → Enter email: `manufacturer@pharma.com`
3. Click **"Continue"**

**Expected Result:**
- ✅ Alert: "Invitation Found - You have been invited as manufacturer"
- ✅ Button: "Setup Password"

4. Click **"Setup Password"**
5. On Password Setup screen, verify:
   - ✅ Role icon shows (blue business icon)
   - ✅ Email displayed: `manufacturer@pharma.com`
   - ✅ Role displayed: "Manufacturer"
   - ✅ Company displayed: "XYZ Pharma Ltd"

6. Fill in:
   - Name: `Sarah Manufacturer`
   - Password: `manu123`
   - Confirm Password: `manu123`
   - Company Name: (pre-filled) `XYZ Pharma Ltd`
   - License Number: `LIC-2024-001`
   - Address: `123 Pharma Street, City`

7. Click **"Create Account"**

**Expected Result:**
- ✅ Success alert: "Account created successfully"
- ✅ Auto-login and redirect to Manufacturer Dashboard
- ✅ Dashboard shows: "Hello, Sarah Manufacturer"
- ✅ Company name: "XYZ Pharma Ltd"

**Backend Verification:**
```bash
db.users.find({email: "manufacturer@pharma.com"})
db.invitations.find({email: "manufacturer@pharma.com"})
```
**Expected:**
- User created with role "manufacturer"
- Invitation status changed to "accepted"

---

#### **Test 3.2: Distributor Password Setup**
**Steps:**
1. Logout → Login with: `distributor@logistics.com`
2. Click "Continue" → "Setup Password"
3. Fill in:
   - Name: `Mike Distributor`
   - Password: `dist123`
   - Confirm Password: `dist123`
4. Click "Create Account"

**Expected Result:**
- ✅ Redirect to Distributor Dashboard
- ✅ Purple/secondary color theme
- ✅ Statistics cards visible

---

#### **Test 3.3: Retailer Password Setup**
**Steps:**
1. Logout → Login with: `retailer@pharmacy.com`
2. Click "Continue" → "Setup Password"
3. Fill in:
   - Name: `Lisa Retailer`
   - Password: `retail123`
   - Confirm Password: `retail123`
4. Click "Create Account"

**Expected Result:**
- ✅ Redirect to Retailer Dashboard
- ✅ Cyan/info color theme
- ✅ Expiry tracking statistics visible

---

### **PHASE 4: Product Creation (Manufacturer)**

#### **Test 4.1: Generate QR Codes**
**Steps:**
1. Login as Manufacturer (`manufacturer@pharma.com` / `manu123`)
2. Navigate to **"Generate QR"** from dashboard
3. Fill in:
   - Drug Name: `Paracetamol 500mg`
   - Batch Number: `BATCH-2024-001`
   - Quantity: `10`
   - Manufacturing Date: Select date (e.g., today)
   - Expiry Date: Select date (e.g., 1 year from now)
   - Description: `Pain relief medication`
4. Click **"Generate QR Codes"**

**Expected Result:**
- ✅ Success message
- ✅ 10 QR codes generated
- ✅ Each QR has unique serial number
- ✅ Can view/download QR codes

**Backend Verification:**
```bash
db.drugs.find({batch_number: "BATCH-2024-001"}).count()
```
**Expected:** 10 documents

**Save Serial Number:** Note down one serial number for testing (e.g., `DRG-2024-ABC123`)

---

### **PHASE 5: Geo-Location Scanning**

#### **Test 5.1: Manufacturer Scan (Manufacture)**
**Steps:**
1. On Manufacturer Dashboard → Click **"Scan Product"**
2. **Grant Camera Permission** when prompted
3. **Grant Location Permission** when prompted
4. Wait for location to auto-fetch
5. Verify:
   - ✅ GPS coordinates displayed
   - ✅ Address auto-filled (reverse geocoded)
   - ✅ Flashlight auto-enabled
   - ✅ Green corner markers visible

6. Scan the QR code (or manually enter serial number)
7. After scan:
   - ✅ Success icon appears
   - ✅ Serial number displayed
   - ✅ Location card shows address
   - ✅ Coordinates visible (small text)
   - ✅ Address is editable

8. Add notes: `Product manufactured and quality checked`
9. Click **"Submit Scan"**

**Expected Result:**
- ✅ Success alert: "Product scanned successfully! Scan Type: manufacture"
- ✅ Options: "Scan Another" or "Back to Dashboard"

**Backend Verification:**
```bash
db.scan_locations.find({serial_number: "DRG-2024-ABC123"})
```
**Expected:**
```json
{
  "serial_number": "DRG-2024-ABC123",
  "scanned_by_role": "manufacturer",
  "scan_type": "manufacture",
  "location": {
    "coordinates": {
      "latitude": 28.6139,
      "longitude": 77.2090
    },
    "address": "New Delhi, India"
  },
  "notes": "Product manufactured and quality checked"
}
```

---

#### **Test 5.2: Manufacturer Scan (Distribution)**
**Steps:**
1. Click **"Scan Another"**
2. Scan the **same serial number** again
3. Location auto-fetches (different location if moved)
4. Add notes: `Dispatched to distributor`
5. Click **"Submit Scan"**

**Expected Result:**
- ✅ Success alert: "Scan Type: distribution"
- ✅ Second scan recorded

**Backend Verification:**
```bash
db.scan_locations.find({serial_number: "DRG-2024-ABC123"}).count()
```
**Expected:** 2 documents

---

#### **Test 5.3: Distributor Scan**
**Steps:**
1. **Logout** → Login as Distributor (`distributor@logistics.com` / `dist123`)
2. On Distributor Dashboard → Click **"Scan Product"**
3. Grant permissions
4. Scan the **same serial number**
5. Verify:
   - ✅ Role indicator: "Distributor Scan" (purple badge)
   - ✅ Location auto-fetched
   - ✅ Address editable

6. Add notes: `Received at warehouse, stored in cold storage`
7. Click **"Submit Scan"**

**Expected Result:**
- ✅ Success alert: "Product tracked successfully! Total scans in journey: 3"
- ✅ Journey info displayed

**Backend Verification:**
```bash
db.scan_locations.find({serial_number: "DRG-2024-ABC123"}).count()
```
**Expected:** 3 documents

---

#### **Test 5.4: Retailer Scan**
**Steps:**
1. **Logout** → Login as Retailer (`retailer@pharmacy.com` / `retail123`)
2. On Retailer Dashboard → Click **"Scan Product"**
3. Grant permissions
4. Scan the **same serial number**
5. Verify:
   - ✅ Role indicator: "Retailer Scan" (cyan badge)
   - ✅ Info card: "This scan will record the product's arrival..."
   - ✅ Location labeled as "Store Location"

6. Add notes: `Product received in good condition`
7. Click **"Confirm Receipt"**

**Expected Result:**
- ✅ Success alert with journey summary
- ✅ Current location displayed

**Backend Verification:**
```bash
db.scan_locations.find({serial_number: "DRG-2024-ABC123"}).count()
```
**Expected:** 4 documents

---

### **PHASE 6: Product Journey Verification**

#### **Test 6.1: View Complete Journey (Customer)**
**Steps:**
1. **Logout** → Signup as Customer
   - Name: `Customer User`
   - Email: `customer@email.com`
   - Password: `cust123`
   - Role: **Customer**

2. On Customer Dashboard → Click **"Scan Product"**
3. Scan the **same serial number**

**Expected Result:**
- ✅ Product verification screen appears
- ✅ Drug info displayed (Paracetamol 500mg)
- ✅ Genuine/Fake status shown
- ✅ **"View Journey"** button visible

4. Click **"View Journey"**

**Expected Journey:**
```
1. MANUFACTURE
   - Scanned by: Sarah Manufacturer (XYZ Pharma Ltd)
   - Location: [Address 1]
   - Date: [Timestamp]
   - Notes: Product manufactured and quality checked

2. DISTRIBUTION (Manufacturer)
   - Scanned by: Sarah Manufacturer
   - Location: [Address 2]
   - Date: [Timestamp]
   - Notes: Dispatched to distributor

3. DISTRIBUTION (Distributor)
   - Scanned by: Mike Distributor (Fast Logistics Inc)
   - Location: [Address 3]
   - Date: [Timestamp]
   - Notes: Received at warehouse, stored in cold storage

4. RETAIL
   - Scanned by: Lisa Retailer (HealthMart Pharmacy)
   - Location: [Address 4]
   - Date: [Timestamp]
   - Notes: Product received in good condition

5. VERIFICATION (Customer)
   - Scanned by: Customer User
   - Location: [Current location]
   - Date: [Now]
```

**Expected Result:**
- ✅ All 5 scans visible in chronological order
- ✅ Each scan shows: role, name, company, location, notes, timestamp
- ✅ Map/timeline view (if implemented)

---

### **PHASE 7: Owner User Management**

#### **Test 7.1: View All Users**
**Steps:**
1. Login as Owner (`owner@company.com` / `owner123`)
2. Click **"Manage Users"** from Quick Actions
3. Verify all users listed:
   - ✅ John Owner (Owner)
   - ✅ Sarah Manufacturer (Manufacturer)
   - ✅ Mike Distributor (Distributor)
   - ✅ Lisa Retailer (Retailer)
   - ✅ Customer User NOT shown (excluded)

4. Test search: Type "Sarah"
5. Test filter: Click "Manufacturers" tab

**Expected Result:**
- ✅ Search works
- ✅ Filters work
- ✅ Each user shows: name, email, company, role badge, active status

---

#### **Test 7.2: Deactivate User**
**Steps:**
1. Find Sarah Manufacturer in list
2. Click **"Deactivate"** button
3. Confirm in alert

**Expected Result:**
- ✅ Success message
- ✅ User status changes to "Inactive" (red indicator)
- ✅ User cannot login

**Verification:**
1. Logout → Try to login as `manufacturer@pharma.com`
2. **Expected:** Login fails or shows "Account deactivated"

---

#### **Test 7.3: Activate User**
**Steps:**
1. Login as Owner
2. Go to Manage Users
3. Find Sarah Manufacturer
4. Click **"Activate"** button

**Expected Result:**
- ✅ User status changes to "Active" (green indicator)
- ✅ User can login again

---

#### **Test 7.4: Delete Invitation**
**Steps:**
1. Send a new invitation: `test@example.com` (Manufacturer)
2. Go to **"Manage Invitations"**
3. Find the test invitation
4. Click **"Delete"** button
5. Confirm

**Expected Result:**
- ✅ Invitation removed from list
- ✅ User cannot use that invitation

---

### **PHASE 8: Dashboard Statistics**

#### **Test 8.1: Owner Statistics**
**Steps:**
1. Login as Owner
2. Verify dashboard statistics:
   - ✅ Total Users: 4 (owner + 3 invited)
   - ✅ Manufacturers: 1
   - ✅ Distributors: 1
   - ✅ Retailers: 1

3. Pull down to refresh
4. Verify stats update

---

#### **Test 8.2: Manufacturer Statistics**
**Steps:**
1. Login as Manufacturer
2. Verify dashboard:
   - ✅ Total Drugs: 10 (from batch)
   - ✅ Active QRs: 10
   - ✅ Total Scans: 2 (manufacture + distribution)

---

#### **Test 8.3: Distributor Statistics**
**Steps:**
1. Login as Distributor
2. Verify dashboard:
   - ✅ Total Scans: 1
   - ✅ Products Tracked: 1
   - ✅ Recent scans show the product

---

#### **Test 8.4: Retailer Statistics**
**Steps:**
1. Login as Retailer
2. Verify dashboard:
   - ✅ Total Scans: 1
   - ✅ Products Received: 1
   - ✅ Valid Stock: 1 (not expired)
   - ✅ Expiring Soon: 0

---

## 🔍 **EDGE CASES & ERROR TESTING**

### **Test 9.1: Duplicate Email Registration**
**Steps:**
1. Try to signup with existing email: `owner@company.com`

**Expected Result:**
- ✅ Error: "Email already exists"

---

### **Test 9.2: Invalid Invitation**
**Steps:**
1. Login with email that has no invitation: `random@email.com`

**Expected Result:**
- ✅ Error: "No account or invitation found for this email"

---

### **Test 9.3: Scan Non-Existent Product**
**Steps:**
1. Login as Distributor
2. Try to scan serial number: `FAKE-123-456`

**Expected Result:**
- ✅ Error: "Product not found"

---

### **Test 9.4: Scan Without Location Permission**
**Steps:**
1. Deny location permission
2. Try to scan product

**Expected Result:**
- ✅ Warning shown: "Location permission not granted"
- ✅ Can still scan but location fields empty
- ✅ Can manually enter address

---

### **Test 9.5: Distributor Scans Unmanufactured Product**
**Steps:**
1. Create new batch but don't scan it
2. Login as Distributor
3. Try to scan the new serial number

**Expected Result:**
- ✅ Error: "Product has not been manufactured yet"

---

## ✅ **COMPLETE TESTING CHECKLIST**

### **Authentication**
- [ ] Owner signup works
- [ ] Customer signup works
- [ ] Manufacturer signup works (legacy)
- [ ] Login with invitation check works
- [ ] Password setup for invited users works
- [ ] Role-based routing after login works
- [ ] Logout works from all dashboards

### **Invitation System**
- [ ] Owner can send invitations
- [ ] Invitations appear in list
- [ ] Search invitations works
- [ ] Filter invitations works
- [ ] Delete invitation works
- [ ] Invitation status updates after acceptance

### **User Management**
- [ ] View all users works
- [ ] Search users works
- [ ] Filter users by role works
- [ ] Activate user works
- [ ] Deactivate user works
- [ ] Deactivated user cannot login

### **Product Creation**
- [ ] Manufacturer can generate QR codes
- [ ] Correct number of QRs created
- [ ] Each QR has unique serial number
- [ ] QR codes are scannable

### **Geo-Location Scanning**
- [ ] Camera permissions requested
- [ ] Location permissions requested
- [ ] GPS coordinates auto-fetch
- [ ] Reverse geocoding works
- [ ] Address is editable
- [ ] Flashlight auto-enables
- [ ] QR codes scan successfully
- [ ] Manufacturer scan (manufacture) works
- [ ] Manufacturer scan (distribution) works
- [ ] Distributor scan works
- [ ] Retailer scan works
- [ ] Customer verification works

### **Product Journey**
- [ ] Complete journey displays correctly
- [ ] All scans shown in chronological order
- [ ] Each scan shows correct info
- [ ] Location addresses visible
- [ ] Notes displayed

### **Dashboards**
- [ ] Owner dashboard loads
- [ ] Manufacturer dashboard loads
- [ ] Distributor dashboard loads
- [ ] Retailer dashboard loads
- [ ] Customer dashboard loads
- [ ] Statistics display correctly
- [ ] Pull-to-refresh works
- [ ] Recent scans/activity shows

### **Error Handling**
- [ ] Duplicate email rejected
- [ ] Invalid invitation handled
- [ ] Non-existent product handled
- [ ] Missing permissions handled
- [ ] Unmanufactured product scan rejected

---

## 📊 **EXPECTED FINAL STATE**

After completing all tests:

### **Database State**
```
users: 5 documents
  - 1 owner
  - 1 manufacturer
  - 1 distributor
  - 1 retailer
  - 1 customer

invitations: 3-4 documents
  - 3 accepted
  - 0-1 pending (if test invitation not deleted)

drugs: 10 documents
  - All from BATCH-2024-001
  - Status: active

scan_locations: 5 documents
  - 2 by manufacturer (manufacture, distribution)
  - 1 by distributor (distribution)
  - 1 by retailer (retail)
  - 1 by customer (verification)
```

---

## 🎯 **SUCCESS CRITERIA**

✅ **All 9 phases completed**
✅ **All checklist items passed**
✅ **No critical errors**
✅ **Complete supply chain journey tracked**
✅ **Geo-location data captured at each step**
✅ **All roles functional**

---

## 📝 **NOTES**

### **Common Issues & Solutions**

**Issue:** Location not fetching
**Solution:** Ensure device has GPS enabled and app has location permission

**Issue:** QR code not scanning
**Solution:** Ensure good lighting, hold steady, flashlight should auto-enable

**Issue:** Camera permission denied
**Solution:** Go to device settings → App permissions → Enable camera

**Issue:** Backend connection failed
**Solution:** Check backend is running on correct IP/port, update API_BASE_URL in frontend

---

## 🚀 **QUICK TEST SCRIPT**

For rapid testing, use these credentials:

```
Owner:
  Email: owner@company.com
  Password: owner123

Manufacturer:
  Email: manufacturer@pharma.com
  Password: manu123

Distributor:
  Email: distributor@logistics.com
  Password: dist123

Retailer:
  Email: retailer@pharmacy.com
  Password: retail123

Customer:
  Email: customer@email.com
  Password: cust123
```

**Test Serial Number:** Use any from BATCH-2024-001

---

**Testing Complete!** 🎉

All features of the role-based supply chain tracking system with geo-location have been tested and verified.
