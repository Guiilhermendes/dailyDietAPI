# Daily Diet API

A RESTful API for daily diet tracking built with Fastify, TypeScript, and SQLite.

## 🚀 Technologies

- **Node.js** - JavaScript runtime
- **TypeScript** - Typed JavaScript superset
- **Fastify** - Fast and efficient web framework
- **Knex.js** - SQL query builder
- **SQLite3** - Relational database
- **Zod** - Schema validation library
- **Vitest** - Testing framework
- **Supertest** - HTTP testing library
- **ESLint** - JavaScript/TypeScript linter

## 📋 Features

### Users
- [x] Create user
- [x] Identify user between requests
- [x] Get user profile data

### Meals
- [x] Create a meal
- [x] Edit a meal (only by the user who created it)
- [x] Delete a meal (only by the user who created it)
- [x] List all meals for a user
- [x] View a single meal

### Metrics
- [x] Retrieve user metrics
  - [x] Total number of registered meals
  - [x] Total number of meals within the diet
  - [x] Total number of meals outside the diet
  - [x] Best sequence of meals within the diet

## 🛡️ Business Rules

- [x] Only possible to view, edit and delete meals created by the user themselves
- [x] User identification is done via session ID in cookies

## 🏗️ Project Structure

```
src/
├── @types/          # TypeScript type definitions
├── middlewares/     # Application middlewares
├── routes/          # API routes
├── app.ts           # Fastify application setup
├── database.ts      # Knex configuration
└── server.ts        # HTTP server

database/
└── migrations/      # Database migrations

test/               # E2E tests
```

## 🚦 Installation and Setup

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd daily-diet-api

# Install dependencies
npm install

# Run migrations
npm run knex -- migrate:latest
```

### Usage

#### Development
```bash
npm run dev
```

#### Production
```bash
npm run build
npm start
```

#### Tests
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📚 API Documentation

### Users

#### POST /users
Creates a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

#### GET /users/me
Returns logged user data (requires session cookie)

### Meals

#### POST /meals
Creates a new meal (requires authentication)
```json
{
  "name": "Breakfast",
  "description": "Whole grain bread with avocado",
  "dateTime": "2023-10-01T08:00:00.000Z",
  "isOnDiet": true
}
```

#### GET /meals
Lists all user meals (requires authentication)

#### GET /meals/:id
Gets a specific meal (requires authentication)

#### PUT /meals/:id
Updates a meal (requires authentication)
```json
{
  "name": "New meal name",
  "description": "New description",
  "dateTime": "2023-10-01T08:30:00.000Z",
  "isOnDiet": false
}
```

#### DELETE /meals/:id
Deletes a meal (requires authentication)

#### GET /meals/metrics
Returns user metrics (requires authentication)

## 🧪 Testing

The project includes comprehensive E2E tests covering all main features:

- User tests (creation, profile, authentication)
- Meal tests (complete CRUD)
- Metrics tests
- Authorization and authentication tests

To run tests:

```bash
npm test
```

## 🔧 Database Configuration

The project uses SQLite for simplicity, but can be easily configured to use PostgreSQL, MySQL or other databases supported by Knex.js.

### Migrations

Migrations are automatically executed in development environment. To run manually:

```bash
npm run knex -- migrate:latest
```

### Rollback

To undo the latest migration:

```bash
npm run knex -- migrate:rollback
```
