# Backend API Documentation - Role-Based Supply Chain System

## Base URL
```
http://localhost:5000
```

---

## Authentication Endpoints

### 1. Check Invitation
**POST** `/auth/check-invitation`

Check if an email has a pending invitation.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Invitation Found):**
```json
{
  "success": true,
  "has_account": false,
  "has_invitation": true,
  "invitation": {
    "_id": "invitation_id",
    "email": "user@example.com",
    "role": "manufacturer",
    "company_name": "ABC Pharma"
  },
  "message": "Invitation found, proceed to password setup"
}
```

**Response (User Exists):**
```json
{
  "success": true,
  "has_account": true,
  "has_invitation": false,
  "message": "User exists, proceed to login"
}
```

---

### 2. Setup Password
**POST** `/auth/setup-password`

Setup password for invited user and create account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "company_name": "ABC Pharma",
  "license_number": "LIC123456",
  "address": "123 Main St, City"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "manufacturer",
    "company_name": "ABC Pharma"
  },
  "role": "manufacturer"
}
```

---

### 3. Login
**POST** `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "manufacturer"
  },
  "role": "manufacturer"
}
```

---

## Owner Endpoints
**Authorization:** Requires `owner` role

### 1. Send Invitation
**POST** `/owner/invite`

Send role invitation to an email.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "role": "manufacturer",
  "company_name": "XYZ Pharma"
}
```

**Valid Roles:** `manufacturer`, `distributor`, `retailer`

**Response:**
```json
{
  "success": true,
  "message": "Invitation sent to newuser@example.com",
  "invitation": {
    "_id": "invitation_id",
    "email": "newuser@example.com",
    "role": "manufacturer",
    "status": "pending",
    "created_at": "2024-03-23T10:00:00Z"
  }
}
```

---

### 2. Get Invitations
**GET** `/owner/invitations?status=pending&page=1&limit=20`

Get all invitations sent by the owner.

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `accepted`, `expired`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "invitations": [
    {
      "_id": "invitation_id",
      "email": "user@example.com",
      "role": "manufacturer",
      "company_name": "ABC Pharma",
      "status": "pending",
      "created_at": "2024-03-23T10:00:00Z",
      "accepted_at": null
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### 3. Delete Invitation
**DELETE** `/owner/invitations/<invitation_id>`

Delete/cancel an invitation.

**Response:**
```json
{
  "success": true,
  "message": "Invitation deleted successfully"
}
```

---

### 4. Get Users
**GET** `/owner/users?role=manufacturer&page=1&limit=20`

Get all users (excluding customers).

**Query Parameters:**
- `role` (optional): Filter by role
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "manufacturer",
      "company_name": "ABC Pharma",
      "is_active": true,
      "created_at": "2024-03-23T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "total_pages": 3
}
```

---

### 5. Activate/Deactivate User
**POST** `/owner/users/<user_id>/activate`
**POST** `/owner/users/<user_id>/deactivate`

Activate or deactivate a user account.

**Response:**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

---

### 6. Get Statistics
**GET** `/owner/statistics`

Get system statistics for owner dashboard.

**Response:**
```json
{
  "success": true,
  "statistics": {
    "users": {
      "total": 100,
      "by_role": {
        "owner": 1,
        "manufacturer": 25,
        "distributor": 30,
        "retailer": 40,
        "customer": 4
      }
    },
    "invitations": {
      "total": 50,
      "pending": 20,
      "accepted": 30,
      "by_role": {
        "manufacturer": 15,
        "distributor": 20,
        "retailer": 15
      }
    }
  }
}
```

---

## Supply Chain Endpoints

### Manufacturer Endpoints
**Authorization:** Requires `manufacturer` role

#### 1. Scan Product
**POST** `/supply-chain/manufacturer/scan`

Record product creation/dispatch with geo-location.

**Request Body:**
```json
{
  "serial_number": "DRG-2024-ABC123",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "New Delhi, India",
  "notes": "Product dispatched to distributor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product scanned successfully (manufacture)",
  "scan": {
    "_id": "scan_id",
    "serial_number": "DRG-2024-ABC123",
    "scan_type": "manufacture",
    "location": {
      "coordinates": {
        "latitude": 28.6139,
        "longitude": 77.2090
      },
      "address": "New Delhi, India"
    },
    "scanned_at": "2024-03-23T10:00:00Z"
  }
}
```

**Scan Types:**
- `manufacture`: First scan (product created)
- `distribution`: Subsequent scans (product dispatched)

---

#### 2. Get Manufacturer Scans
**GET** `/supply-chain/manufacturer/scans?limit=100`

Get all scans performed by this manufacturer.

**Response:**
```json
{
  "success": true,
  "scans": [
    {
      "_id": "scan_id",
      "serial_number": "DRG-2024-ABC123",
      "scan_type": "manufacture",
      "location": {
        "coordinates": {"latitude": 28.6139, "longitude": 77.2090},
        "address": "New Delhi, India"
      },
      "notes": "Product created",
      "scanned_at": "2024-03-23T10:00:00Z",
      "drug_info": {
        "drug_name": "Paracetamol 500mg",
        "batch_number": "BATCH-001"
      }
    }
  ],
  "total": 150
}
```

---

### Distributor Endpoints
**Authorization:** Requires `distributor` role

#### 1. Scan Product
**POST** `/supply-chain/distributor/scan`

Record product receipt/movement with geo-location.

**Request Body:**
```json
{
  "serial_number": "DRG-2024-ABC123",
  "latitude": 19.0760,
  "longitude": 72.8777,
  "address": "Mumbai, India",
  "notes": "Product received at warehouse"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product scanned successfully (distribution)",
  "scan": {
    "_id": "scan_id",
    "serial_number": "DRG-2024-ABC123",
    "scan_type": "distribution",
    "location": {
      "coordinates": {"latitude": 19.0760, "longitude": 72.8777},
      "address": "Mumbai, India"
    },
    "scanned_at": "2024-03-23T11:00:00Z"
  },
  "journey": {
    "total_scans": 2,
    "current_location": "Mumbai, India"
  }
}
```

---

#### 2. Get Distributor Scans
**GET** `/supply-chain/distributor/scans?limit=100`

Get all scans performed by this distributor.

---

### Retailer Endpoints
**Authorization:** Requires `retailer` role

#### 1. Scan Product
**POST** `/supply-chain/retailer/scan`

Record product receipt at retail location with geo-location.

**Request Body:**
```json
{
  "serial_number": "DRG-2024-ABC123",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "Bangalore, India",
  "notes": "Product received at store"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Product scanned successfully (retail)",
  "scan": {
    "_id": "scan_id",
    "serial_number": "DRG-2024-ABC123",
    "scan_type": "retail",
    "location": {
      "coordinates": {"latitude": 12.9716, "longitude": 77.5946},
      "address": "Bangalore, India"
    },
    "scanned_at": "2024-03-23T12:00:00Z"
  },
  "journey": {
    "total_scans": 3,
    "current_location": "Bangalore, India"
  }
}
```

---

#### 2. Get Retailer Scans
**GET** `/supply-chain/retailer/scans?limit=100`

Get all scans performed by this retailer.

---

### Common Endpoints
**Authorization:** Requires any authenticated user

#### 1. Get Product Journey
**GET** `/supply-chain/product/journey/<serial_number>`

Get complete supply chain journey for a product.

**Response:**
```json
{
  "success": true,
  "product": {
    "serial_number": "DRG-2024-ABC123",
    "drug_name": "Paracetamol 500mg",
    "batch_number": "BATCH-001",
    "manufacturer": "ABC Pharma"
  },
  "journey": [
    {
      "scan_type": "manufacture",
      "scanned_by_role": "manufacturer",
      "scanned_by": {
        "name": "John Doe",
        "company_name": "ABC Pharma"
      },
      "location": {
        "coordinates": {"latitude": 28.6139, "longitude": 77.2090},
        "address": "New Delhi, India"
      },
      "notes": "Product created",
      "scanned_at": "2024-03-23T10:00:00Z"
    },
    {
      "scan_type": "distribution",
      "scanned_by_role": "distributor",
      "scanned_by": {
        "name": "Jane Smith",
        "company_name": "XYZ Distributors"
      },
      "location": {
        "coordinates": {"latitude": 19.0760, "longitude": 72.8777},
        "address": "Mumbai, India"
      },
      "notes": "Received at warehouse",
      "scanned_at": "2024-03-23T11:00:00Z"
    },
    {
      "scan_type": "retail",
      "scanned_by_role": "retailer",
      "scanned_by": {
        "name": "Bob Johnson",
        "company_name": "HealthMart"
      },
      "location": {
        "coordinates": {"latitude": 12.9716, "longitude": 77.5946},
        "address": "Bangalore, India"
      },
      "notes": "Received at store",
      "scanned_at": "2024-03-23T12:00:00Z"
    }
  ],
  "current_location": "Bangalore, India",
  "total_scans": 3
}
```

---

#### 2. Get Supply Chain Statistics
**GET** `/supply-chain/statistics`

Get supply chain statistics based on user role.

**Response (Manufacturer):**
```json
{
  "success": true,
  "statistics": {
    "by_type": [
      {"_id": "manufacture", "count": 100},
      {"_id": "distribution", "count": 80}
    ],
    "by_role": [
      {"_id": "manufacturer", "count": 100},
      {"_id": "distributor", "count": 50},
      {"_id": "retailer", "count": 30}
    ],
    "recent_scans": [...],
    "total_scans": 180
  }
}
```

**Response (Distributor/Retailer):**
```json
{
  "success": true,
  "statistics": {
    "total_scans": 50,
    "unique_products": 45,
    "scans_by_date": {
      "2024-03-23": 10,
      "2024-03-22": 15
    },
    "recent_scans": [...]
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation error",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "Unauthorized: This product does not belong to you"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to record scan",
  "details": "error message"
}
```

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The token is returned after successful login or password setup.

---

## Workflow Summary

### 1. Owner Invites User
1. Owner logs in
2. Owner sends invitation: `POST /owner/invite`
3. Invitation created with status `pending`

### 2. Invited User Sets Up Account
1. User enters email on login screen
2. Frontend checks: `POST /auth/check-invitation`
3. If invitation found, redirect to password setup
4. User sets password: `POST /auth/setup-password`
5. Account created, invitation marked `accepted`
6. User auto-logged in with token

### 3. Product Scanning Workflow
1. **Manufacturer** creates product and scans: `POST /supply-chain/manufacturer/scan` (manufacture)
2. **Manufacturer** dispatches product and scans: `POST /supply-chain/manufacturer/scan` (distribution)
3. **Distributor** receives product and scans: `POST /supply-chain/distributor/scan` (distribution)
4. **Retailer** receives product and scans: `POST /supply-chain/retailer/scan` (retail)
5. **Customer** verifies product: `POST /customer/verify` (existing endpoint)

### 4. View Product Journey
Anyone can view complete journey: `GET /supply-chain/product/journey/<serial_number>`

---

## Database Collections

### users
- Stores all user accounts with roles
- Indexed on: email (unique), role

### invitations
- Stores pending/accepted invitations
- Indexed on: email, status, invited_by, role

### scan_locations
- Stores all supply chain scans with geo-location
- Indexed on: serial_number, scanned_by_id, scanned_by_role, scan_type

### drugs
- Stores product information
- Indexed on: serial_number (unique), batch_number, manufacturer_id
