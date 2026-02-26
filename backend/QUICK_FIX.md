# Quick Fix: Get the Project Running

## Why This Fix?
- ✅ Automates dependency installation
- ✅ Handles database syncing
- ✅ Clears ports and starts both servers
- ⏱️ Takes 2 minutes

## Step-by-Step Instructions

### 1. Ensure Node.js is installed
Download from [nodejs.org](https://nodejs.org/) (LTS version recommended).

### 2. Run Setup
Double-click `setup.bat` in the root folder. This will:
- Install backend and frontend dependencies.
- Update the database schema.

### 3. Run Project
Double-click `run-project.bat` in the root folder. This will:
- Clear ports 3000 and 4000.
- Start the Backend and Frontend servers.
- Automatically open the browser to `localhost:3000`.

## Done!
If you still encounter issues, check your `.env` file in the `backend` folder and ensure your `DATABASE_URL` is correct.
