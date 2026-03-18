# Drug Track & Trace System

A complete production-ready pharmaceutical track-and-trace platform with role-based authentication for Customers and Manufacturers. Built with React Native (Expo) and Flask with MongoDB.

## 🎯 Overview

This system allows:
- **Customers**: Scan QR codes on medicine packages to verify authenticity, expiry status, and recall status
- **Manufacturers**: Generate QR codes for drug batches, manage inventory, and recall batches when needed

## 🏗️ Architecture

- **Frontend**: React Native (Expo) - Cross-platform mobile application
- **Backend**: Python Flask - REST API server with role-based authentication
- **Database**: MongoDB - NoSQL database for flexible data storage

## 📱 Features

### For Customers:
1. **Scan Drug QR Code** - Verify medicine authenticity instantly
2. **View Scan History** - Track all verification history
3. **Report Suspicious Drugs** - Report counterfeit or suspicious medicines
4. **Profile Management** - View account information

### For Manufacturers:
1. **Generate QR Codes** - Create QR codes for new drug batches with quantity
2. **View All Batches** - Monitor all generated drug batches
3. **Recall Drug Batch** - Recall entire batches when needed
4. **Dashboard Statistics** - View total drugs, batches, and recalls
5. **Profile Management** - Manage company information

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher) and npm/yarn
- **Python** 3.8+
- **MongoDB** (local or cloud instance)
- **Expo Go** app (for mobile testing)

### Installation

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd Track-Trace
```

#### 2. Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
# Edit .env file with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/
# DATABASE_NAME=track-trace

# Seed the database with sample data
python seed_data.py

# Start the Flask server
python run.py
```

The backend server will start on `http://localhost:8001`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
# or
yarn install

# Configure API URL
# Edit .env file
# EXPO_PUBLIC_API_URL=http://localhost:8001

# Start Expo development server
npm start
# or
yarn start
```

### Running the Application

1. **Start Backend Server**:
   ```bash
   cd backend
   python run.py
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm start
   ```

3. **Open on Device/Emulator**:
   - **Android**: Press `a` in terminal or scan QR with Expo Go
   - **iOS**: Press `i` in terminal or scan QR with Expo Go
   - **Physical Device**: Scan QR code with Expo Go app

## 👥 Demo Credentials

### Customer Account
- **Email**: customer@test.com
- **Password**: customer123

### Manufacturer Account
- **Email**: manufacturer@pharma.com
- **Password**: manu123
- **Company**: PharmaCorp Ltd

### Admin Account
- **Email**: admin@pharma.com
- **Password**: admin123

## 📊 Database Schema

### Collections

#### Users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password_hash: String,
  role: String (customer/manufacturer/admin),
  company_name: String (optional, for manufacturers),
  license_number: String (optional, for manufacturers),
  address: String (optional),
  created_at: DateTime,
  updated_at: DateTime
}
```

#### Drugs
```javascript
{
  _id: ObjectId,
  drug_name: String,
  manufacturer: String,
  manufacturer_id: String,
  batch_number: String,
  serial_number: String (unique),
  expiry_date: String (YYYY-MM-DD),
  manufacturing_date: String (YYYY-MM-DD),
  description: String (optional),
  status: String (active/recalled),
  created_at: DateTime,
  updated_at: DateTime
}
```

#### ScanLogs
```javascript
{
  _id: ObjectId,
  user_id: String,
  serial_number: String,
  scan_result: Object,
  drug_info: Object (optional),
  scanned_at: DateTime
}
```

#### Reports
```javascript
{
  _id: ObjectId,
  user_id: String,
  serial_number: String,
  issue_description: String,
  issue_type: String (fake/expired/damaged/suspicious/other),
  status: String (pending/resolved),
  created_at: DateTime,
  updated_at: DateTime
}
```

## 🔐 API Endpoints

### Authentication
- `POST /auth/register` - Register new user with role selection
- `POST /auth/login` - Login user (returns JWT token and role)
- `GET /auth/me` - Get current user information
- `GET /auth/verify-token` - Verify JWT token

### Manufacturer APIs (Protected)
- `POST /manufacturer/drug/generate` - Generate QR codes for drug batch
- `GET /manufacturer/drugs` - Get all drugs by manufacturer
- `GET /manufacturer/batches` - Get all batches by manufacturer
- `POST /manufacturer/recall` - Recall a drug batch
- `GET /manufacturer/batch/:batchNumber` - Get batch details
- `GET /manufacturer/stats` - Get manufacturer statistics

### Customer APIs (Protected)
- `GET /customer/verify/:serialNumber` - Verify drug by serial number
- `GET /customer/history` - Get scan history
- `POST /customer/report` - Submit drug report
- `GET /customer/reports` - Get user's reports

### Admin APIs (Protected)
- `GET /admin/reports` - Get all reports
- `PUT /admin/report/:reportId/status` - Update report status
- `GET /admin/drugs` - Get all drugs
- `GET /admin/scans` - Get all scan logs
- `GET /admin/stats` - Get system statistics

## 🔒 Security Features

- **JWT-based Authentication** with role embedded in token
- **Password Hashing** with bcrypt
- **Role-Based Access Control** - Strict route protection
- **Input Validation** with Pydantic
- **Protected API Routes** - Middleware validation
- **Token Expiration** - 24-hour default

## 🎨 UI/UX Features

- Modern, clean mobile interface
- Real-time QR code scanning with camera
- Color-coded verification results:
  - ✅ Green - Genuine
  - ❌ Red - Fake or Recalled
  - ⚠️ Orange - Expired
- Role-based navigation (Customer vs Manufacturer dashboards)
- Pull-to-refresh on lists
- Responsive design

## 📱 Permissions Required

### iOS
- Camera access for QR scanning

### Android
- Camera permission

## 🛠️ Technologies Used

### Frontend
- React Native (Expo)
- Expo Router for navigation
- Expo Camera for QR scanning
- Axios for API calls
- AsyncStorage for local storage
- JWT Decode for token handling

### Backend
- Flask (Python)
- PyMongo (MongoDB driver)
- PyJWT for authentication
- Bcrypt for password hashing
- Pydantic for data validation
- QRCode for QR generation

### Database
- MongoDB for document storage

## 📁 Project Structure

```
Track-Trace/
├── backend/
│   ├── models/
│   │   ├── user.py
│   │   ├── drug.py
│   │   ├── scan_log.py
│   │   └── report.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── manufacturer.py
│   │   ├── customer.py
│   │   └── admin.py
│   ├── utils/
│   │   ├── database.py
│   │   ├── auth.py
│   │   ├── validators.py
│   │   └── helpers.py
│   ├── config.py
│   ├── app.py
│   ├── run.py
│   ├── seed_data.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/
│   │   ├── customer/
│   │   │   ├── home.js
│   │   │   ├── scanner.js
│   │   │   ├── result.js
│   │   │   ├── history.js
│   │   │   ├── report.js
│   │   │   └── profile.js
│   │   ├── manufacturer/
│   │   │   ├── home.js
│   │   │   ├── generate.js
│   │   │   ├── qr-codes.js
│   │   │   ├── batches.js
│   │   │   └── profile.js
│   │   ├── index.js
│   │   ├── login.js
│   │   ├── register.js
│   │   └── _layout.js
│   ├── contexts/
│   │   └── AuthContext.js
│   ├── services/
│   │   └── api.js
│   ├── constants/
│   │   └── Colors.js
│   ├── package.json
│   ├── app.json
│   └── .env
├── README.md
├── SETUP.md
└── API_DOCUMENTATION.md
```

## 🔄 Data Flow

1. User registers/logs in with role selection
2. JWT token with role is stored locally
3. App routes to appropriate dashboard based on role
4. **Customer Flow**:
   - Scans QR code → Serial number sent to backend
   - Backend verifies in database
   - Returns status (genuine/fake/expired/recalled)
   - Scan logged in database
5. **Manufacturer Flow**:
   - Enters drug details and quantity
   - Backend generates unique serial numbers
   - QR codes created for each unit
   - Batch stored in database

## 🚀 Deployment

### Backend Deployment
- Deploy to Heroku, AWS, or DigitalOcean
- Use MongoDB Atlas for cloud database
- Set environment variables in production

### Frontend Deployment
- Build with `expo build:android` or `expo build:ios`
- Publish to Google Play Store / Apple App Store
- Or use Expo's EAS Build service

## 🧪 Testing

### Test the APIs
Import the Postman collection (`postman_collection.json`) to test all endpoints.

### Test QR Scanning
Use the sample data generated by `seed_data.py` to test scanning functionality.

## 📄 License

This project is a proof of concept for educational purposes.

## 👥 Support

For issues and questions, please create an issue in the repository.

---

**Built with ❤️ for pharmaceutical safety**
