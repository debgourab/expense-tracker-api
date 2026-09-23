# Expense Tracker API

[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)](https://mongoosejs.com/)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdebgourab%2Fexpense-tracker-api&env=MONGO_URI,JWT_SECRET&envDescription=MongoDB%20connection%20string%20and%20JWT%20secret%20required%20for%20the%20Expense%20Tracker%20API)

A production-ready REST API for an Expense Tracker application. It provides JWT authentication, protected expense CRUD operations, category-wise spending summaries, MongoDB persistence, and a small static frontend for local demos.

Repository: [https://github.com/debgourab/expense-tracker-api](https://github.com/debgourab/expense-tracker-api)

## Features

- User signup and login with JWT authentication
- Secure password hashing with `bcryptjs`
- Protected expense routes scoped to the authenticated user
- Create, read, update, and delete expense records
- Category-wise dashboard totals using MongoDB aggregation
- Request validation and consistent JSON error responses
- MongoDB schemas with Mongoose timestamps and indexes
- Optional CORS allowlist for a separately deployed frontend
- Vercel-ready Express export with local `npm start` support
- Static demo UI served from `public/`

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js 20+ |
| Framework | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JSON Web Tokens |
| Password Hashing | bcryptjs |
| Deployment | Vercel |

## Project Structure

```text
.
|-- config/
|   `-- env.js
|-- middleware/
|   `-- authMiddleware.js
|-- models/
|   |-- Expense.js
|   `-- User.js
|-- public/
|   |-- app.js
|   |-- index.html
|   `-- styles.css
|-- routes/
|   |-- auth.js
|   `-- expenses.js
|-- .env.example
|-- .gitignore
|-- package-lock.json
|-- package.json
|-- server.js
`-- vercel.json
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- MongoDB Atlas cluster or a local MongoDB server

### Installation

```bash
git clone https://github.com/debgourab/expense-tracker-api.git
cd expense-tracker-api
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/expense-tracker
JWT_SECRET=replace-this-with-a-long-random-secret
JWT_EXPIRES_IN=1d
CLIENT_ORIGIN=http://localhost:5000
```

Start the API:

```bash
npm run dev
```

Production-style local start:

```bash
npm start
```

Open the local demo UI at [http://localhost:5000](http://localhost:5000), or check the API health endpoint:

```bash
curl http://localhost:5000/health
```

## Environment Variables

| Variable | Required | Description | Example |
| --- | --- | --- | --- |
| `PORT` | No | Local server port. Vercel provides its own port automatically. | `5000` |
| `MONGO_URI` | Yes on Vercel | MongoDB connection string. Use MongoDB Atlas for production. | `mongodb+srv://...` |
| `JWT_SECRET` | Yes on Vercel | Secret used to sign and verify JWTs. Use a long random value. | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | No | JWT lifetime accepted by `jsonwebtoken`. | `1d` |
| `CLIENT_ORIGIN` | No | Comma-separated CORS allowlist. Leave blank to allow all origins. | `https://your-client.vercel.app` |

## API Reference

Base URL for local development:

```text
http://localhost:5000
```

### Health

#### `GET /health`

Returns API status.

```json
{
  "status": "ok",
  "message": "Expense Tracker API is running"
}
```

### Authentication

#### `POST /auth/signup`

Creates a new user and returns a JWT.

Request body:

```json
{
  "name": "Deb Gourab",
  "email": "deb@example.com",
  "password": "password123"
}
```

#### `POST /auth/login`

Authenticates an existing user and returns a JWT.

Request body:

```json
{
  "email": "deb@example.com",
  "password": "password123"
}
```

Successful auth response:

```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "name": "Deb Gourab",
    "email": "deb@example.com"
  }
}
```

### Expenses

All expense routes require this header:

```text
Authorization: Bearer <token>
```

#### `GET /expenses`

Returns all expenses for the authenticated user.

#### `POST /expenses`

Creates a new expense.

Request body:

```json
{
  "title": "Groceries",
  "amount": 750,
  "category": "Food",
  "date": "2026-09-23"
}
```

#### `PUT /expenses/:id`

Updates one expense owned by the authenticated user. You can send one or more fields.

```json
{
  "amount": 950,
  "category": "Shopping"
}
```

#### `DELETE /expenses/:id`

Deletes one expense owned by the authenticated user.

#### `GET /expenses/dashboard/category-totals`

Returns totals grouped by category.

```json
[
  {
    "count": 3,
    "category": "Food",
    "totalAmount": 2450
  }
]
```

## Data Models

### User

| Field | Type | Notes |
| --- | --- | --- |
| `name` | String | Required, max 60 characters |
| `email` | String | Required, unique, lowercase |
| `password` | String | Required, hashed, hidden by default |
| `createdAt` | Date | Added by Mongoose |
| `updatedAt` | Date | Added by Mongoose |

### Expense

| Field | Type | Notes |
| --- | --- | --- |
| `title` | String | Required, max 100 characters |
| `amount` | Number | Required, minimum `0.01` |
| `category` | String | Required, max 50 characters |
| `date` | Date | Defaults to current date |
| `userId` | ObjectId | Required, indexed, references `User` |
| `createdAt` | Date | Added by Mongoose |
| `updatedAt` | Date | Added by Mongoose |

## Vercel Deployment

This API is prepared for Vercel with:

- `module.exports = app` in `server.js` for Express detection
- `vercel.json` with the Express framework preset
- `engines.node` set to Node.js 20+
- Lazy MongoDB connection handling for serverless function reuse

### Deploy from GitHub

1. Push this server folder to [https://github.com/debgourab/expense-tracker-api](https://github.com/debgourab/expense-tracker-api).
2. Open [Vercel New Project](https://vercel.com/new).
3. Import the GitHub repository.
4. Keep the framework preset as Express, or allow Vercel to detect it.
5. Add these environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` (optional)
   - `CLIENT_ORIGIN` (optional)
6. Deploy.
7. Test the deployed health endpoint:

```bash
curl https://your-project.vercel.app/health
```

### Deploy from the CLI

Install and run the Vercel CLI:

```bash
npm i -g vercel
vercel link
vercel env add MONGO_URI
vercel env add JWT_SECRET
vercel deploy
vercel --prod
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API locally with Nodemon |
| `npm start` | Start the API with Node.js |
| `npm run check` | Run syntax checks for server source files |

## Security Notes

- Never commit `.env` or production secrets.
- Use a strong `JWT_SECRET` in production.
- Use MongoDB Atlas or another hosted MongoDB provider for Vercel deployments.
- Set `CLIENT_ORIGIN` to your frontend domain when the client is hosted separately.
- Tokens are bearer credentials. Store and send them carefully from the frontend.

## License

This project is licensed under the MIT License.

## Author

**Deb Gourab Biswas**

- GitHub: [debgourab](https://github.com/debgourab)
- Repository: [expense-tracker-api](https://github.com/debgourab/expense-tracker-api)
