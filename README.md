# Expense Tracker API

**Node.js and Express backend for ExpenseFlow, a full-stack personal expense tracker.**

Manage expenses, explore spending patterns, and access personal financial records through an authenticated REST API. Built with MongoDB, Mongoose, and JWT authentication, this backend powers a separately deployed web client.

**[Live Application](https://expensetracker-deb.vercel.app/)** · **[API Information](https://expense-tracker-api-ya3s.onrender.com/api)** · **[API Health Check](https://expense-tracker-api-ya3s.onrender.com/health)**

[Backend Repository](https://github.com/debgourab/expense-tracker-api) · [Frontend Repository](https://github.com/debgourab/expense-tracker-client)

## Overview

ExpenseFlow helps users record everyday expenses and understand where their money goes. This repository contains the backend: account management, protected expense operations, filtering, sorting, and spending summaries.

The project demonstrates practical backend development through modular Express routes, reusable middleware, Mongoose data models, user-level authorization, and HTTP tests.

## Key Features

- **Account authentication:** Signup, login, and authenticated profile access using JWTs and bcryptjs password hashing.
- **Expense management:** Create, view, update, and delete expenses belonging to the signed-in user.
- **Search and filtering:** Find transactions by search text, category, and date range.
- **Flexible sorting:** Order expenses by date or amount.
- **Spending analytics:** Retrieve category totals and overall/current-month spending summaries through MongoDB aggregation.
- **Input validation:** Validate requests and return consistent JSON error responses.
- **API safeguards:** Authentication rate limiting, Helmet headers, configurable CORS, and request body limits.
- **Operational visibility:** Request IDs, HTTP logging, health checks, database readiness checks, and graceful shutdown.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Language and runtime | JavaScript, Node.js 24 |
| API framework | Express.js |
| Database and modeling | MongoDB, Mongoose |
| Authentication | JSON Web Token, bcryptjs |
| Middleware | Helmet, CORS, express-rate-limit, compression, Morgan |
| Testing | Node.js test runner, Supertest |
| Development | npm, Nodemon, Git, GitHub |
| Hosting | Render for the backend; Vercel for the separate frontend |

## Backend Design

The browser client sends HTTP requests to the Express API. Authentication middleware verifies access tokens before protected routes access MongoDB through Mongoose.

- **Routes** handle authentication, expense operations, and analytics.
- **Models** define user and expense data structures.
- **Middleware** handles authentication, rate limiting, request IDs, and errors.
- **Configuration** manages environment variables and database connections.
- **Application and server separation** allows HTTP tests to exercise the Express app independently of server startup.

Expense reads, updates, deletions, and aggregations are scoped to the authenticated user's ID, preventing one account from accessing another account's records.

## Project Structure

| Path | Purpose |
| --- | --- |
| `config/` | Environment configuration and MongoDB connection management |
| `middleware/` | Authentication, error handling, rate limiting, and request IDs |
| `models/` | User and Expense Mongoose models |
| `routes/` | Authentication and expense API routes |
| `test/health.test.js` | Service health and related HTTP checks |
| `test/error-handling.test.js` | Error-response and validation checks |
| `.env.example` | Example environment configuration |
| `.gitignore` | Excludes dependencies, local secrets, and other local files |
| `app.js` | Express application and middleware setup |
| `server.js` | Server startup and shutdown handling |
| `package.json` | Dependencies and npm scripts |
| `package-lock.json` | Locked dependency versions |

## Run Locally

### Prerequisites

- Node.js 24 and npm
- A MongoDB connection string, from MongoDB Atlas or a local database
- Git

### 1. Clone and install

```bash
git clone https://github.com/debgourab/expense-tracker-api.git
cd expense-tracker-api
npm ci
cp .env.example .env
```

The commands above work in Git Bash. In PowerShell, use `Copy-Item .env.example .env` to copy the environment file.

### 2. Configure the environment

Edit `.env` before starting the server:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/expense-tracker
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
JWT_ISSUER=expense-tracker-api
JWT_AUDIENCE=expense-tracker-client
CLIENT_ORIGIN=http://localhost:5000,https://expensetracker-deb.vercel.app
LOG_FORMAT=dev
```

Replace `MONGO_URI` if using Atlas. Add local frontend's exact origin to `CLIENT_ORIGIN` if it runs on another port. Origins are comma-separated and should not include trailing slashes.

Generate a random JWT secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
```

Keep `.env`, database credentials, and JWT secrets out of Git and browser code.

### 3. Start the application

```bash
npm run dev
```

- API information: `http://localhost:5000/api`
- Health check: `http://localhost:5000/health`
- Database readiness: `http://localhost:5000/ready`

## API Reference

**Deployed API base URL:**

```text
https://expense-tracker-api-ya3s.onrender.com
```

Routes are relative to this base URL; authentication and expense routes do not use an additional `/api` prefix.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api` | Public | API information |
| GET | `/health` | Public | Service health |
| GET | `/ready` | Public | Database readiness |
| POST | `/auth/signup` | Public | Register an account |
| POST | `/auth/login` | Public | Log in and receive an access token |
| GET | `/auth/me` | Bearer token | Retrieve the current user |
| GET | `/expenses` | Bearer token | List, search, filter, and sort expenses |
| POST | `/expenses` | Bearer token | Create an expense |
| GET | `/expenses/:id` | Bearer token | Retrieve an owned expense |
| PUT | `/expenses/:id` | Bearer token | Update an owned expense |
| DELETE | `/expenses/:id` | Bearer token | Delete an owned expense |
| GET | `/expenses/dashboard/category-totals` | Bearer token | Retrieve totals by category |
| GET | `/expenses/dashboard/summary` | Bearer token | Retrieve spending summary metrics |

### Authentication

Register or log in to obtain a token, then include it in protected requests:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Example request after logging in locally:

```bash
curl http://localhost:5000/expenses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Replace `YOUR_ACCESS_TOKEN` with the token returned by signup or login.

### Expense queries

`GET /expenses` supports `category`, `search`, `from`, `to`, and `sort`. Available sort values are `newest`, `oldest`, `highest`, and `lowest`.

```text
/expenses?search=travel&from=2026-01-01&to=2026-12-31&sort=highest
```

## Validation and Testing

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server with Nodemon |
| `npm start` | Start the server |
| `npm run check` | Check application JavaScript syntax |
| `npm test` | Run the remaining HTTP tests |
| `npm run validate` | Run syntax checks and tests together |

The retained test suite covers service health and readiness, HTTP headers, request tracing, CORS behavior, validation errors, malformed JSON, and unknown routes. It does not represent complete end-to-end coverage of every database operation.

```bash
npm run validate
```

## Deployment Configuration

The backend is deployed on **Render**, and the separate frontend is deployed on **Vercel**.

| Backend setting | Value |
| --- | --- |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Health check path | `/health` |
| Node.js major version | `24` |
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | `https://expensetracker-deb.vercel.app` |

Configure `MONGO_URI` and a strong `JWT_SECRET` as backend environment variables. Ensure the database permits connections from the hosting service.

The frontend should use `https://expense-tracker-api-ya3s.onrender.com` as its API base URL. Database credentials and JWT signing secrets belong only in the backend environment.

## Author

**Deb Gourab Biswas**  
Full Stack Developer | JavaScript · React.js · Node.js · MongoDB

- **GitHub:** [debgourab](https://github.com/debgourab)
- **Live application:** [ExpenseFlow](https://expensetracker-deb.vercel.app/)
- **Backend repository:** [expense-tracker-api](https://github.com/debgourab/expense-tracker-api)
- **Frontend repository:** [expense-tracker-client](https://github.com/debgourab/expense-tracker-client)
