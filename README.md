# NexaOps – ERP & CRM Operations Portal

A modern, responsive, and full-stack Operations Portal for wholesale/distribution businesses, built with React (TypeScript), Node.js (TypeScript/Express), and PostgreSQL.

## Core Modules & Features

1. **Authentication & Role-Based Access Control (RBAC)**:
   - Credentials check using bcrypt hashes.
   - JWT sessions.
   - Dynamic sidebar navigation matching role authorization limits.
2. **Dashboard**:
   - High-level KPIs (Total Customers, Catalog Items, Low-stock alerts, Confirmed Challans, Units Sold).
   - Live feed of the recent stock movements log.
3. **Customer CRM**:
   - Search & filters by status (Lead, Active, Inactive) or type (Retail, Wholesale, Distributor).
   - Follow-up logs management.
4. **Products & Inventory**:
   - Low-stock visual flags.
   - Live inventory adjustments log (IN / OUT).
5. **Sales Challans**:
   - Safely deducts stock for confirmed challans, rejects negative stock requests, and logs database snapshots of items.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or cloud instance)

### 1. Database Configuration
Create a PostgreSQL database named `fundstrom_erp`.

### 2. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Setup environment variables in the `.env` file:
   ```env
   PORT=5000
   DB_USER=postgres
   DB_HOST=localhost
   DB_DATABASE=fundstrom_erp
   DB_PASSWORD=Dimple@0514
   DB_PORT=5432
   JWT_SECRET=supersecretfundstromkey12345
   ```
3. Install dependencies and run build:
   ```bash
   npm install
   npm run build
   ```
4. Start the backend server:
   ```bash
   npm run start
   ```
   *The database schema will automatically build and seed initial mock data on startup.*

### 3. Frontend Setup
1. Open another terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:5173/` in your browser.

## Test Credentials

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `Admin` |
| **Sales** | `sales` | `Sales` |
| **Warehouse** | `warehouse` | `Warehouse` |
| **Accounts** | `accounts` | `Accounts` |
