# Shadow-Protocol: MessMate — Smart Mess Management QR Attendance System

A full-stack, secure, real-time dining mess attendance management system built with **React (Vite)**, **Node.js + Express**, and **PostgreSQL**. Designed with high cryptographic security to block proxy attendance, double-entries, screenshot re-use, and out-of-schedule scans.

---

## 🌟 Key Architecture & Highlights

- **Shared Database & Backend**: Single Express REST API and PostgreSQL database powering both portals.
- **Role-Based Portals**:
  - `/student`: Student portal matching the **MessMate UI** design from the reference screens. Features dynamic 30-second auto-rotating QR codes, smooth countdown timer (`New code in 00:24`), meal slot indicators (`Breakfast`, `Lunch`, `Dinner`), used badges, and real-time attendance history table.
  - `/staff`: Responsive mobile & counter terminal with camera-based QR scanning via `html5-qrcode`, 2-second scan duplicate suppression, prominent **GREEN** (`Entry allowed`) / **RED** (`Already eaten`, `Invalid QR`, `Expired QR`, `Wrong meal time`) alerts, today's meal counters, and live scan logs.
- **Cryptographic Dynamic QR (Anti-Proxy / Anti-Screenshot)**:
  - QR payload is a signed JSON Web Token containing `{ student_id, meal_id, date, nonce }`.
  - Expiry is set to **60 seconds**, refreshed automatically by the client every **30 seconds**.
  - Student identity is never exposed in plain text inside the QR code.
  - Double entry blocked by database `UNIQUE(student_id, meal_id, date)` constraint.
- **Built-in Time Window Simulator**:
  - Located on the top bar for testing anytime. Allows testing Breakfast (`07:30 - 09:30`), Lunch (`12:30 - 14:30`), Dinner (`19:30 - 21:30`), and Off-Hours without waiting or modifying system clocks.
- **Fail-Safe Persistence Adapter**:
  - Connects to PostgreSQL using `pg.Pool` with `DATABASE_URL`.
  - If a PostgreSQL server is not currently running locally, it seamlessly switches to an embedded in-memory/persisted adapter so the entire system can be tested immediately with zero setup blockers.

---

## 📁 Project Structure

```
mess/
├── package.json               # Root scripts
├── README.md                  # Complete documentation and setup guide
├── client/                    # Frontend React + Vite + Tailwind CSS
│   ├── index.html             # Application HTML shell
│   ├── vite.config.js         # Vite configuration with /api proxy
│   ├── tailwind.config.js     # Tailwind design system configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── package.json           # Frontend dependencies
│   └── src/
│       ├── main.jsx           # React DOM root
│       ├── App.jsx            # Routing (/student & /staff) & auth shell
│       ├── index.css          # Styles, custom scrollbars & laser scanner animation
│       ├── components/
│       │   ├── Navbar.jsx         # Header with breadcrumbs, role switch & profile
│       │   ├── Sidebar.jsx        # MessMate sidebar matching UI design (Page 3)
│       │   ├── QRScannerView.jsx  # html5-qrcode camera scanner & manual token input
│       │   └── TimeSimulator.jsx  # Slot simulator for evaluation anytime
│       ├── pages/
│       │   ├── Login.jsx          # Login view with role toggles & instant demo buttons
│       │   ├── StudentPortal.jsx  # Page 1 (/student): 30s rotating QR & history table
│       │   └── StaffPortal.jsx    # Page 2 (/staff): Live scanner & status alerts
│       └── utils/
│           └── api.js             # Fetch wrappers and JWT storage
└── server/                    # Backend Node.js + Express + PostgreSQL
    ├── index.js               # Express application entry point & health check
    ├── package.json           # Backend dependencies (express, pg, jsonwebtoken, bcryptjs)
    ├── .env                   # Environment variables (PORT, JWT_SECRET, DATABASE_URL)
    ├── .env.example           # Example environment template
    ├── test-e2e.js            # Automated 16-step E2E test verification suite
    ├── db/
    │   ├── index.js           # Database connection & query engine
    │   ├── schema.sql         # PostgreSQL schema DDL
    │   └── seed.js            # Seeder for students, staff, meals & sample logs
    ├── middleware/
    │   └── auth.js            # JWT verification & role authorization (requireRole)
    ├── routes/
    │   ├── auth.js            # /api/auth/login, /api/auth/me
    │   ├── meals.js           # /api/meals, /api/meals/today-stats
    │   ├── qr.js              # /api/qr/:mealId (generates 60s rotating JWT)
    │   ├── scan.js            # /api/scan (6-step verification pipeline)
    │   └── student.js         # /api/student/history
    └── utils/
        └── timeUtils.js       # Time window calculation and date formatters
```

---

## 🗄️ Database Tables (PostgreSQL)

```sql
-- 1. Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_no VARCHAR(50) UNIQUE NOT NULL,
    hostel VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Staff Table
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Meals Table
CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- 4. Mess Entries Table (Attendance Log)
CREATE TABLE mess_entries (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    meal_id INTEGER NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    scanned_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_student_meal_date UNIQUE (student_id, meal_id, date)
);
```

---

## 🛡️ Backend `/api/scan` Security Checks (In Exact Order)

1. **Role Check**: Requesting user must be authenticated with role `'staff'`.
2. **Signature & Expiry Check**: Validates the JWT signature using `JWT_SECRET` and checks that the token is not older than 60 seconds.
3. **Date Equality Check**: Token date must match the current mess date (`YYYY-MM-DD`). Old screenshots are immediately rejected.
4. **Time Window Check**: Current time must fall within the token's meal `start_time` and `end_time` (e.g. Lunch between 12:30 and 14:30).
5. **Double-Entry Enforcement**: Inserts into `mess_entries`. If PostgreSQL throws error `23505` (unique violation on `unique_student_meal_date`), the API returns HTTP 409 with status `"Already eaten"`.
6. **Authorized Output**: Returns student name, roll number, hostel, meal name, and status `"Entry allowed"`.

---

## 🚀 Quick Setup & Run Instructions

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **PostgreSQL** (optional: if not running, system automatically uses the embedded adapter)

### 2. Configure Environment (`server/.env`)
```bash
PORT=5000
JWT_SECRET=mess_management_super_secret_jwt_key_2026
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mess_db
```

### 3. Install & Start Backend
Open a terminal:
```bash
cd server
npm install
npm run seed     # Seeds meals, demo students, and staff accounts
npm run dev      # Starts Express on http://localhost:5000
```

### 4. Install & Start Frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Now open **http://localhost:5173** in your browser.

---

## 🔑 Pre-Seeded Demo Credentials

| Role | Name | Roll No / Username | Password | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Aarav Sharma | `CS21B042` | `password123` | North Block Room N-204 (Featured in UI) |
| **Student** | Priya Patel | `CS21B018` | `password123` | North Block Room N-108 |
| **Student** | Rohan Verma | `ME21B005` | `password123` | South Block Room S-301 |
| **Staff** | Priya Mehta | `admin` | `staff123` | Mess Secretary |
| **Staff** | Rajesh Kumar | `counter1` | `staff123` | Counter 1 Scanner Staff |

> **Tip**: The login screen includes 1-click **Instant Demo Account** pills for rapid testing.

---

## 🧪 Automated End-to-End Verification

A comprehensive automated test suite covers all 12 operational checks:
```bash
cd server
node test-e2e.js
```

### Test Coverage Results:
- Health check
- Student login & JWT issuance
- Staff login & JWT issuance
- Dynamic meal window calculations
- Rotating 60s single-use QR token generation (`{ student_id, meal_id, date, nonce }`)
- Plain credentials omitted from QR payload
- Student blocked from calling scanner endpoint (`HTTP 403`)
- Staff scanner verification: `"Entry allowed"`
- Database constraint double-scan blocking: `"Already eaten"` (`HTTP 409`)
- Expired QR rejection: `"Expired QR"` (`HTTP 400`)
- Out-of-window scan rejection: `"Wrong meal time"` (`HTTP 400`)
- Student attendance history table verification
- Staff today counters & live scan list
