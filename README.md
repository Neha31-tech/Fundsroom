## FundsRoom – ERP & CRM Operations Portal

A modern, responsive, full-stack ERP and CRM Operations Portal designed for wholesale and distribution businesses. FundsRoom provides centralized management of customers, products, inventory, stock movements, sales challans, PDF documents, and role-based access for Admin, Sales, Warehouse, and Accounts teams.

Backend: Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL, JWT Authentication, Zod Validation
Frontend: React, TypeScript, Vite, React Router, Axios
Database: PostgreSQL hosted on Neon
Deployment: Cloudflare Workers with Cloudflare Hyperdrive
Repository layout: backend/ (REST API) and frontend/ (admin UI), each independently deployable.

## Architecture Overview

FundsRoom follows a separated frontend and backend architecture.

The frontend provides the user interface and communicates with the backend through REST APIs. The backend handles authentication, authorization, validation, business logic, inventory operations, PDF generation, and database operations.

The backend follows a layered architecture:

Routes → Authentication/Role Middleware → Controllers → Prisma ORM → PostgreSQL

Authentication is implemented using stateless JWT authentication. After successful login, the backend generates a signed JWT containing the authenticated user's information and role.

The frontend stores the authentication token and attaches it to API requests using the:

Authorization: Bearer <token>

header.

Role-based access is enforced at the backend through authorization middleware. The frontend also conditionally displays navigation items and action buttons based on the logged-in user's role for a better user experience.

The frontend is implemented as a single-page React application with protected routes and separate modules for:

Customers
Products
Inventory
Stock Movements
Sales Challans
PDF Documents
Challan Confirmation Logic

The core business rule of the application is the stock validation performed when confirming a sales challan.

When a challan is confirmed, the system checks the current stock availability of every product included in the challan.

If any product has insufficient stock:

The challan is not confirmed.
Product stock is not deducted.
No incomplete stock movement is created.
The user receives an appropriate validation error.

Only when all products have sufficient stock does the system deduct the required quantities and record the corresponding stock movement.

Draft challans do not affect inventory.

When a confirmed challan is cancelled, the deducted quantities are restored to inventory and the corresponding stock movement is recorded.

Product Snapshot Logic

Challan items preserve important product information at the time the transaction is created, including product name, SKU, unit price, and quantity.

This ensures historical challan and invoice information remains accurate even if the product catalog is updated later.

##  Local Setup
Prerequisites

The following software is required:

Node.js 18+
npm
PostgreSQL
Git
VS Code
Backend

Navigate to the backend directory:

cd backend

Install dependencies:

npm install

Create the environment file:

cp .env.example .env

Configure the required database and authentication variables in .env.

Run Prisma database setup:

npx prisma migrate dev --name init

Generate the Prisma client if required:

npx prisma generate

Run the seed script:

npm run seed

Start the backend development server:

npm run dev

The local backend API runs on:

http://localhost:5000
Frontend

Open another terminal and navigate to the frontend:

cd frontend

Install dependencies:

npm install

Create the frontend environment file:

cp .env.example .env

Configure the API URL in the frontend .env file.

Example:

VITE_API_URL=http://localhost:5000

Start the frontend:

npm run dev

The frontend normally runs on:

http://localhost:5173

Open the frontend URL in a browser and log in using one of the seeded accounts.

## Test Login Credentials

The application provides four role-based test accounts.

| Role          | Username    | Password    |
| ------------- | ----------- | ----------- |
| **Admin**     | `admin`     | `Admin`     |
| **Sales**     | `sales`     | `Sales`     |
| **Warehouse** | `warehouse` | `Warehouse` |
| **Accounts**  | `accounts`  | `Accounts`  |


Admin

Full application access
Customer management
Product management
Inventory management
Stock adjustments
Sales challans
PDF challans/invoices
Dashboard access

Sales

Customer CRM
Customer follow-ups
Product viewing
Sales challan creation
Challan management

Warehouse

Product management
Inventory management
Stock IN/OUT adjustments
Stock movement monitoring
Inventory-related challan operations

Accounts

Customer viewing
Product viewing
Sales challan viewing
Invoice/challan PDF access
Billing and reporting information
## Environment Variables
Backend

The backend environment configuration contains the following variables:

Variable	Purpose
DATABASE_URL	PostgreSQL database connection
JWT_SECRET	Secret used to sign and verify JWT tokens
JWT_EXPIRES_IN	JWT token lifetime
PORT	Backend API port
CORS_ORIGIN	Allowed frontend origin(s)
Frontend
Variable	Purpose
VITE_API_URL	Base URL of the backend REST API

Environment files containing secrets are not committed to GitHub.

Only example environment files such as .env.example should be committed.

## Deployment

FundsRoom is deployed using Cloudflare infrastructure with Neon PostgreSQL.

Database

Neon PostgreSQL is used as the production database.

The PostgreSQL database stores:

Users
Customers
Products
Stock movements
Challans
Challan items
Follow-up information
Transaction-related data
Database Connection

Cloudflare Hyperdrive is used to connect the deployed backend with the Neon PostgreSQL database.

This provides a managed database connection layer between the Cloudflare Worker backend and the PostgreSQL database.

Backend Deployment

Production backend:

https://fundsroom-backend.nehamadhushalini05.workers.dev

The backend is deployed as a Cloudflare Worker.

Production frontend:

https://fundsroom-frontend.nehamadhushalini05.workers.dev

The frontend is deployed separately and communicates with the production backend through the configured API URL.


FundsRoom also supports PDF document generation for sales transactions.

PDF documents can contain:

Customer information
Challan number
Product details
SKU
Quantity
Unit price
Total amount
Transaction details

The generated PDF challan/invoice can be used for billing, customer communication, and record keeping.

Postman API Testing

The API can be tested using the Postman collection included in the project.

The login request can be executed first to obtain the JWT token. The token can then be supplied in authenticated requests using:

Authorization: Bearer <token>
## Assumptions Made
Role Permissions

Role permissions are based on the responsibilities of each team.

Admin has complete access to the application.
Sales manages customers, CRM activities, and sales challans.
Warehouse manages products, inventory, and stock movements.
Accounts has access to customer, product, challan, and billing-related information.
Inventory Management

Stock is updated only through valid inventory operations.

Manual stock movements are recorded as IN or OUT operations.

Challan Confirmation

Draft challans do not reduce inventory.

Stock is deducted only after successful challan confirmation and stock validation.

Challan Cancellation

When a confirmed challan is cancelled, the previously deducted stock is restored.

The restoration is also recorded in the stock movement history.

Low-Stock Alert

A product is considered low stock when its current quantity reaches or falls below its configured minimum stock alert level.

The low-stock status is displayed within the inventory interface.

Product Information Snapshot

Challan items preserve product information at the time of the transaction so historical records remain consistent when the product catalog changes.

Authentication

JWT authentication is used to maintain authenticated sessions, and role-based authorization prevents users from performing operations outside their assigned permissions.

Environment Security

Sensitive environment variables such as database credentials and JWT secrets are stored in environment configuration and should not be committed to the repository.

## Known Limitations / Future Enhancements

The current implementation includes the main ERP/CRM workflows, role-based authentication, customer management, product and inventory management, stock movement tracking, sales challans, and PDF challan/invoice generation.

Possible future improvements include:

Automated unit and integration testing
Email notifications for low-stock products
Advanced sales and inventory reports
Product image upload and storage
Automated CI/CD deployment pipeline
## Author
## NehaMadhuShalini
