# 🚗 ZyraGo — Driver-on-Demand Platform

A scalable, modular backend for a driver-on-demand platform built with **NestJS** and **MongoDB**.

## ✨ Features

- **JWT Authentication** — Secure registration & login for Users and Drivers
- **Smart Driver Matching** — Haversine-based algorithm assigns the nearest available driver
- **Booking Lifecycle** — Full trip flow: `requested → assigned → accepted → ongoing → completed`
- **Driver Actions** — Accept/reject bookings with automatic reassignment on rejection
- **Role-Based Access Control** — Strict role enforcement (user vs driver) with granular error messages
- **Real-time Location** — Drivers can update their GPS coordinates
- **Online/Offline Toggle** — Drivers can set availability status
- **Input Validation** — DTOs with `class-validator` for all endpoints
- **Global Error Handling** — Consistent error response format via `HttpExceptionFilter`
- **API Documentation** — Interactive Swagger UI with JWT auth support

## 🛠 Tech Stack

| Layer          | Technology           |
|----------------|----------------------|
| Framework      | NestJS               |
| Database       | MongoDB (Mongoose)   |
| Authentication | JWT (Passport)       |
| Validation     | class-validator      |
| Documentation  | Swagger (OpenAPI)    |
| Language       | TypeScript           |

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally or a MongoDB Atlas URI

### Installation

```bash
git clone https://github.com/FayisKanthapuram/ZyraGo-backend.git
cd ZyraGo-backend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/zyrago
JWT_SECRET=your_jwt_secret_here
```

### Run the Server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📖 API Documentation

Interactive Swagger docs available at:

```
http://localhost:3000/api/docs
```

Click the **Authorize** button and paste your JWT token to test protected endpoints.

## 📡 API Endpoints

### Auth

| Method | Endpoint                | Description          | Auth |
|--------|-------------------------|----------------------|------|
| POST   | `/auth/user/register`   | Register a user      | —    |
| POST   | `/auth/user/login`      | Login as user        | —    |
| POST   | `/auth/driver/register` | Register a driver    | —    |
| POST   | `/auth/driver/login`    | Login as driver      | —    |

### Booking (Requires JWT)

| Method | Endpoint                   | Description                          | Role   |
|--------|----------------------------|--------------------------------------|--------|
| POST   | `/booking`                 | Create a booking                     | User   |
| PATCH  | `/booking/:id/match`       | Match nearest available driver       | User   |
| PATCH  | `/booking/:id/accept`      | Accept assigned booking              | Driver |
| PATCH  | `/booking/:id/reject`      | Reject & auto-reassign               | Driver |
| PATCH  | `/booking/:id/start`       | Start the trip                       | Driver |
| PATCH  | `/booking/:id/complete`    | Complete the trip                    | Driver |

### Driver (Requires JWT + Driver Role)

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| PATCH  | `/driver/location`  | Update current GPS location    |
| PATCH  | `/driver/status`    | Toggle `available` / `offline` |

## 🏗 Project Structure

```
src/
├── auth/
│   ├── dto/                    # RegisterUser, RegisterDriver, Login DTOs
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   ├── decorators/             # @Roles() decorator
│   ├── strategies/             # JWT Strategy
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── booking/
│   ├── dto/                    # CreateBooking DTO
│   ├── schemas/                # Booking Mongoose schema
│   ├── booking.controller.ts
│   ├── booking.service.ts
│   └── booking.module.ts
├── driver/
│   ├── dto/                    # UpdateLocation, UpdateStatus DTOs
│   ├── schemas/                # Driver Mongoose schema
│   ├── driver.controller.ts
│   ├── driver.service.ts
│   └── driver.module.ts
├── user/
│   ├── schemas/                # User Mongoose schema
│   ├── user.service.ts
│   └── user.module.ts
├── common/
│   └── filters/                # Global HttpExceptionFilter
├── app.module.ts
└── main.ts
```

## 🔐 Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be at least 6 characters"],
  "error": "Bad Request",
  "timestamp": "2026-03-26T12:00:00.000Z",
  "path": "/auth/user/register"
}
```

## 📝 License

MIT
