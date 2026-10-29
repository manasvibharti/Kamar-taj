# Kamar-Taj

Kamar-Taj is a mess management web app for recording meal attendance with QR codes. It has separate portals for students and staff, with the backend handling login, meal scheduling, QR verification, and attendance records.

## What the app includes

- Student and staff accounts
- Student view for generating rotating QR codes and checking attendance history
- Staff scanner for approving mess entries
- Meal-wise entry tracking
- Checks for expired codes, duplicate entries, and incorrect meal times
- A time simulator for trying the app outside normal meal hours
- Admin tools for managing users, meals, and mess activity

## Built with

- React and Vite
- Node.js and Express
- PostgreSQL
- JWT authentication
- Tailwind CSS

## Project layout

```text
backend/    API, database access, migrations, and authentication
frontend/   React interface for student, staff, and admin portals
tests/      Backend and route tests
```

## Running locally

### Requirements

- Node.js 18 or newer
- PostgreSQL

### 1. Install dependencies

From the project root:

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Configure the backend

Create a `backend/.env` file using `backend/.env.example` as a guide. At minimum, provide a database URL and JWT secret:

```env
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/kamar_taj
JWT_SECRET=replace-with-a-private-secret
```

### 3. Start PostgreSQL and seed the database

```bash
npm run seed
```

### 4. Start the application

Run the backend and frontend in separate terminals from the project root:

```bash
npm run backend
```

```bash
npm run frontend
```

The frontend usually runs at `http://localhost:5173`, and the backend runs at `http://localhost:5000`.

## Tests

Run the project test suite from the root:

```bash
npm test
```

## Repository

Source code and project updates are maintained at:
https://github.com/manasvibharti/Kamar-taj
