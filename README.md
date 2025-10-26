# 🛍️ Advanced E-Commerce REST API

A production-ready, enterprise-grade e-commerce REST API built with NestJS, PostgreSQL, Prisma, and Docker. This project showcases advanced backend development patterns and best practices for building scalable e-commerce platforms.

## ✨ Features

### 🔐 Authentication & Security
- **JWT-based Authentication** with access and refresh tokens
- **Two-Factor Authentication (2FA)** using TOTP (Time-based One-Time Password)
- **Google OAuth Integration** for social login
- **Role-Based Access Control (RBAC)** with granular permissions
- Session management with Redis
- Secure password hashing with bcrypt

### 🛒 E-Commerce Core Features
- **Product Management** with multi-language support
  - Product SKU (Stock Keeping Unit) system
  - Product variants and attributes
  - Product reviews and ratings
  - Category and brand management
- **Shopping Cart System** with real-time updates
- **Order Management** with comprehensive order lifecycle
- **Multi-language Support** for internationalization
- **Brand Management** with translations

### 💳 Payment Integration
- **SePay Payment Gateway** integration
- Secure payment processing
- Order payment tracking and status management

### ⚡ Advanced Features
- **Redlock Distributed Locking** for handling concurrent orders and preventing race conditions
- **BullMQ Job Queue** for background task processing
- **AWS S3 Integration** for file storage and management
- **AWS SES Integration** for email notifications
- **Redis Caching** for improved performance
- **Real-time Updates** with WebSocket support
- **Swagger API Documentation** for easy API exploration

### 🏗️ Architecture & Best Practices
- Clean architecture with modular design
- DTOs with Zod validation
- Custom decorators and guards
- Global exception filters
- Response interceptors for consistent API responses
- Soft delete support across entities
- Audit trail (createdBy, updatedBy, deletedBy)

## 🛠️ Tech Stack

- **Framework:** NestJS 11.x
- **Language:** TypeScript
- **Database:** PostgreSQL 16
- **ORM:** Prisma 6.x
- **Caching:** Redis (ioredis)
- **Queue:** BullMQ
- **Authentication:** JWT, Speakeasy (2FA), Passport
- **File Storage:** AWS S3
- **Email Service:** AWS SES
- **API Documentation:** Swagger (OpenAPI)
- **Validation:** Zod
- **Containerization:** Docker & Docker Compose
- **Payment Gateway:** SePay

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 16 (if running without Docker)
- Redis (if running without Docker)
- AWS Account (for S3 and SES)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Ecommerce
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="your_db_url"

# Server
PORT=5000

# JWT
JWT_SECRET=your_jwt_secret_here

# Admin Setup
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your_bucket_name
AWS_SES_SENDER_EMAIL=your_email@example.com

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Installation

```bash
npm install
```

### 4. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push database schema
npx prisma db push

# Seed database with initial data
npm run seed

# Setup permissions
npm run permission
```

### 5. Run the Application

#### Development Mode

```bash
npm run start:dev
```

#### Production Mode

```bash
npm run build
npm run start:prod
```

#### Using Docker Compose

```bash
docker-compose up --build
```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

Once the application is running, access the Swagger documentation at:

```
http://localhost:5000/api
```

## 🗂️ Project Structure

```
src/
├── common/                 # Shared utilities and helpers
│   ├── decorator/         # Custom decorators (@Public, @User)
│   ├── filter/            # Exception filters
│   ├── interceptors/      # Response interceptors
│   ├── pipes/             # Custom validation pipes
│   ├── queue/             # BullMQ queue configuration
│   └── services/          # Shared services (Role, S3, SES)
├── db/                    # Database services
│   ├── prisma.service.ts
│   └── redis.service.ts
├── modules/               # Feature modules
│   ├── auth/             # Authentication & Authorization
│   ├── brand/            # Brand management
│   ├── cart/             # Shopping cart
│   ├── category/         # Category management
│   ├── language/         # Multi-language support
│   ├── order/            # Order management
│   ├── payment/          # Payment processing
│   ├── permission/       # Permission management
│   ├── product/          # Product management
│   ├── redlock/          # Distributed locking
│   ├── role/             # Role management
│   └── user/             # User management
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```
