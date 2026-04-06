# Protocol Tournaments - Gaming Platform

Welcome to **Protocol Tournaments**, a world-class esports platform built with Next.js 15 and NestJS.

## 🚀 Features
- **RGB/Neon Aesthetic**: Stunning dark mode design with neon accents.
- **Tournament System**: Browse, filter, and join tournaments for Valorant, PUBG, BGMI, and Free Fire.
- **Team Management**: Create teams, invite members, and manage your roster.
- **Authentication**: Secure JWT-based login and registration.
- **Admin Dashboard**: Manage tournaments and view platform statistics.
- **Secure Payments**: Integrated with Cashfree PG for automated entry fee processing and winnings.

## 🛠️ Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, Framer Motion, Axios.
- **Backend**: NestJS, Prisma (PostgreSQL/SQLite), Passport, JWT.

## 📦 Installation & Setup (Recommended)

1. **Run Setup**:
   Execute the `setup.bat` in the root directory. This will install dependencies for both frontend and backend, and prepare the database.
   ```bash
   setup.bat
   ```

2. **Run Project**:
   Execute the `run-project.bat` in the root directory to start both servers.
   ```bash
   run-project.bat
   ```

## 📦 Manual Installation & Setup

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Set up the database:
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push
```

Start the backend server:
```bash
npm run start
# Server will run on http://localhost:4000
```

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
# App will run on http://localhost:3000
```

## 🧪 How to Test
1. **Register**: Go to `/register` and create a new account.
2. **Login**: Use your credentials to log in.
3. **View Tournaments**: Browse the tournament list on the home page or `/tournaments`.
4. **Create Team**: Go to your dashboard (if implemented) or use the API to create a team.
5. **Admin Access**: Log in with an admin account (role needs to be set in DB) to access `/admin`.

## 📚 Documentation
- **API Walkthrough**: See `walkthrough.md` in the artifacts folder for a list of all backend endpoints.
- **Project Tasks**: See `task.md` for the development roadmap and status.
