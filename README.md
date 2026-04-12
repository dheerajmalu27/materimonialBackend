# Matrimonial Backend API

Express + Sequelize + PostgreSQL backend for the Matrimonial app.

## Overview

This service provides:
- Authentication and OTP flows
- Profile domain (personal, family, education, lifestyle, kundli, partner preference)
- Match discovery and interaction workflows
- Chat + Socket.IO signaling
- Monetization and subscription enforcement
- Notification token registration + invite push hooks
- File uploads (profile photos and bio-data PDF)

## Tech Stack

- Node.js (ES Modules)
- Express 5
- Sequelize + PostgreSQL
- Socket.IO
- Joi validation
- Multer (uploads)
- Swagger (`/api-docs`)

## Project Structure

```text
materimonialBackend/
  src/
    app.js
    server.js
    swagger.js
    config/
    controllers/
    middlewares/
    models/
    modules/
    routes/
    services/
    socket/
    utils/
  uploads/
```

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

## Installation

```bash
cd materimonialBackend
npm install
```

## Environment Variables

Create a `.env` file in `materimonialBackend/`.

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=matrimonial
DB_USER=postgres
DB_PASSWORD=postgres

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=30d

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_CURRENCY=INR

MONETIZATION_FREE_DAILY_INTERESTS_LIMIT=5
MONETIZATION_FREE_DAILY_MESSAGES_LIMIT=5
MONETIZATION_PREMIUM_YEARLY_PRICE_INR=1200
MONETIZATION_PREMIUM_DURATION_DAYS=365
```

## Database Notes

- Ensure the existing project schema/tables are present in your PostgreSQL DB.
- Bio-data PDF support requires this column:

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS biodata_pdf VARCHAR(512);
```

## Run

```bash
npm run dev
```

By default:
- API base: `http://localhost:3000/api/v1`
- Swagger docs: `http://localhost:3000/api-docs`
- Uploads static path: `http://localhost:3000/uploads/...`

## Upload Features

### Profile Photos
- Endpoint: `POST /users/me/photos`
- Storage: `uploads/<userId>/`

### Bio-data PDF
- Endpoint: `POST /users/me/biodata`
- Delete: `DELETE /users/me/biodata`
- Validation: PDF only, max 5 MB
- Storage: `uploads/<userId>/`

## Scripts

- `npm run dev` – start server with nodemon
- `npm start` – start server with nodemon

## Operational Notes

- Server uses Node cluster mode in `src/server.js` and forks workers per CPU core.
- Socket.IO is attached to the same HTTP server instance.
- Keep `PORT` and frontend `API_CONFIG.BASE_URL` aligned.
