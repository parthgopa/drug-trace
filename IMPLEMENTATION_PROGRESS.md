# Role-Based System Implementation Progress

## Overview
Implementing a complete role-based system with email invitations and geo-location tracking for supply chain management.

---

## ✅ PHASE 1: Backend - Database Models (COMPLETED)

### 1. Invitation Model (`backend/models/invitation.py`)
**Purpose**: Manage email invitations for role assignment

**Features**:
- Create invitations with email + role
- Track invitation status (pending/accepted/expired)
- Find invitations by email or ID
- Accept invitations
- Get invitations by owner
- Statistics and pagination

**Workflow**:
1. Owner sends invitation → Status: `pending`
2. User logs in with invited email
3. System detects invitation → Prompts password setup
4. After password setup → Status: `accepted`
5. User created in users collection

### 2. Updated User Model (`backend/models/user.py`)
**New Features**:
- Support for 5 roles: `owner`, `manufacturer`, `distributor`, `retailer`, `customer`
- `invited_by` field to track who invited the user
- `is_active` field for account activation/deactivation
- Role-specific fields (company_name, license_number, address)
- Methods: `get_users_by_role()`, `get_all_users()`, `get_statistics()`, `activate_user()`, `deactivate_user()`

### 3. Updated ScanLocation Model (`backend/models/scan_location.py`)
**Enhanced Geo-Location Support**:
- Separate `latitude` and `longitude` parameters
- `address` field for human-readable location
- Location object structure:
  ```json
  {
    "coordinates": {"latitude": 12.34, "longitude": 56.78},
    "address": "123 Main St, City, Country"
  }
  ```
- New methods: `get_by_user()`, `get_latest_location()`, `get_scans_by_role()`

### 4. Database Indexes (`backend/utils/database.py`)
**New Indexes**:
- Users: `role`
- Scan Locations: `scanned_by_role`, `scan_type`
- Invitations: `email`, `status`, `invited_by`, `role`, `created_at`

---

## ✅ PHASE 2: Backend - Authentication & Invitation APIs (COMPLETED)

### 1. Owner Routes (`backend/routes/owner.py`)
**New Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/owner/invite` | POST | Send role invitation to email |
| `/owner/invitations` | GET | Get all invitations (with filters) |
| `/owner/invitations/<id>` | DELETE | Delete/cancel invitation |
| `/owner/users` | GET | Get all users (exclude customers) |
| `/owner/users/<id>/activate` | POST | Activate user account |
| `/owner/users/<id>/deactivate` | POST | Deactivate user account |
| `/owner/statistics` | GET | Get system statistics |

**Authorization**: All endpoints require `owner` role

### 2. Updated Auth Routes (`backend/routes/auth.py`)
**New Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/check-invitation` | POST | Check if email has pending invitation |
| `/auth/setup-password` | POST | Setup password for invited user |

**Modified Login Flow**:
1. User enters email
2. Frontend calls `/auth/check-invitation`
3. **If invitation exists**: Redirect to password setup screen
4. **If user exists**: Proceed to normal login
5. **If neither**: Show error

**Password Setup Flow**:
1. User provides: email, password, name, company_name, etc.
2. System validates invitation
3. Creates user with invited role
4. Marks invitation as accepted
5. Returns token for auto-login

### 3. App Registration (`backend/app.py`)
- Registered `owner_bp` blueprint at `/owner`
- Updated API version to `2.0.0`
- Added owner endpoint to API documentation

---

## 🔄 PHASE 3: Backend - Geo-Location Scan APIs (IN PROGRESS)

### Next Steps:
1. Create role-specific scan endpoints:
   - `/manufacturer/scan` - Record product creation/dispatch
   - `/distributor/scan` - Record product received/in-transit
   - `/retailer/scan` - Record product received at retail
2. Each endpoint will:
   - Accept: serial_number, latitude, longitude, address, notes
   - Create ScanLocation record with geo-data
   - Update product's current location
   - Return scan confirmation

---

## 📋 PHASE 4: Frontend - Authentication Flow (PENDING)

### Planned Changes:
1. **Modified Login Screen**:
   - Email input → Check invitation
   - If invitation: Show "Setup Password" button
   - If user: Show password field + login
   
2. **New Password Setup Screen**:
   - Display invitation details (role, company)
   - Form: name, password, additional info
   - Auto-login after setup

3. **Role-Based Routing**:
   - After login, route based on role:
     - `owner` → Owner Dashboard
     - `manufacturer` → Manufacturer Dashboard
     - `distributor` → Distributor Dashboard
     - `retailer` → Retailer Dashboard
     - `customer` → Customer Dashboard

---

## 📋 PHASE 5: Frontend - Owner Dashboard (PENDING)

### Planned Features:
1. **Invitation Management**:
   - Send invitation form (email + role + company)
   - View sent invitations (pending/accepted)
   - Delete pending invitations
   
2. **User Management**:
   - View all users by role
   - Activate/deactivate users
   - View user statistics

3. **Statistics Cards**:
   - Total users by role
   - Pending invitations
   - Active users

---

## 📋 PHASE 6: Frontend - Role-Specific Dashboards (PENDING)

### Manufacturer Dashboard:
- Upload products (existing)
- Scan products with geo-location
- View product journey
- Analytics

### Distributor Dashboard:
- Scan products (track movement)
- View received products
- View dispatched products
- Location history

### Retailer Dashboard:
- Scan products (verify receipt)
- View inventory
- Product verification
- Customer scan statistics

---

## 📋 PHASE 7: Frontend - Geo-Location Scan Screens (PENDING)

### Features:
1. **Location Permissions** (expo-location):
   - Request location access
   - Auto-fetch current coordinates
   
2. **Reverse Geocoding**:
   - Convert lat/long → human-readable address
   - Display address (hide coordinates)
   
3. **Scan Screen**:
   - QR scanner
   - Auto-filled location (editable)
   - Notes field
   - Scan type selection
   - Submit scan

---

## 📋 PHASE 8: Integration & Migration (PENDING)

### Tasks:
1. Migrate existing manufacturer users to new system
2. Create initial owner account
3. Test complete workflow
4. Update API documentation

---

## Database Schema

### Users Collection
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "password_hash": "string",
  "role": "owner|manufacturer|distributor|retailer|customer",
  "company_name": "string (optional)",
  "license_number": "string (optional)",
  "address": "string (optional)",
  "invited_by": "string (optional)",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Invitations Collection
```json
{
  "_id": "ObjectId",
  "email": "string",
  "role": "manufacturer|distributor|retailer",
  "invited_by": "string (owner user_id)",
  "company_name": "string (optional)",
  "status": "pending|accepted|expired",
  "created_at": "datetime",
  "expires_at": "datetime (optional)",
  "accepted_at": "datetime (optional)"
}
```

### Scan Locations Collection
```json
{
  "_id": "ObjectId",
  "serial_number": "string",
  "scanned_by_id": "string",
  "scanned_by_role": "string",
  "location": {
    "coordinates": {
      "latitude": "float",
      "longitude": "float"
    },
    "address": "string"
  },
  "scan_type": "manufacture|distribution|retail|verification",
  "notes": "string (optional)",
  "scanned_at": "datetime",
  "created_at": "datetime"
}
```

---

## API Endpoints Summary

### Authentication
- `POST /auth/register` - Register new user (customer only)
- `POST /auth/login` - Login with email/password
- `POST /auth/check-invitation` - Check if email has invitation
- `POST /auth/setup-password` - Setup password for invited user
- `GET /auth/me` - Get current user
- `GET /auth/verify-token` - Verify JWT token

### Owner (Requires owner role)
- `POST /owner/invite` - Send invitation
- `GET /owner/invitations` - Get invitations
- `DELETE /owner/invitations/<id>` - Delete invitation
- `GET /owner/users` - Get all users
- `POST /owner/users/<id>/activate` - Activate user
- `POST /owner/users/<id>/deactivate` - Deactivate user
- `GET /owner/statistics` - Get statistics

### Manufacturer (Coming Soon)
- `POST /manufacturer/scan` - Scan product with geo-location

### Distributor (Coming Soon)
- `POST /distributor/scan` - Scan product with geo-location

### Retailer (Coming Soon)
- `POST /retailer/scan` - Scan product with geo-location

---

## Current Status

✅ **Completed**:
- Database models (Invitation, User, ScanLocation)
- Database indexes
- Owner API endpoints
- Modified authentication flow
- Invitation system backend

🔄 **In Progress**:
- Geo-location scan endpoints

⏳ **Pending**:
- Frontend authentication flow
- Owner dashboard
- Role-specific dashboards
- Geo-location scan screens
- Migration scripts

---

## Next Immediate Steps

1. ✅ Create geo-location scan endpoints for manufacturer/distributor/retailer
2. Create frontend login flow with invitation check
3. Create password setup screen
4. Create owner dashboard
5. Add geo-location permissions to frontend
6. Create role-specific scan screens
