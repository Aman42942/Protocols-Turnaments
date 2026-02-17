# Quick Fix: Switch to SQLite for Local Development

## Why This Fix?
- ✅ Works immediately (no internet needed)
- ✅ No database credentials required
- ✅ Fast for development
- ✅ Easy to reset/recreate
- ⏱️ Takes 2 minutes

## Step-by-Step Instructions

### 1. Update Prisma Schema
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

### 2. Update .env
DATABASE_URL="file:./dev.db"

### 3. Run Commands
npx prisma migrate dev --name init
npx prisma generate
npx prisma db seed (if you have seed data)

### 4. Start Backend
npm run start

## Done!
Your database is now a local file called `dev.db` in your backend folder.
