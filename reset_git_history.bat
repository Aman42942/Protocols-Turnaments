@echo off
echo [STEP 1] Resetting local Git history...
if exist .git (
    rmdir /s /q .git
)

echo [STEP 2] Initializing new repository...
git init

echo [STEP 3] Adding files (skipping .env via .gitignore)...
git add .

echo [STEP 4] Creating first fresh commit...
git commit -m "Fresh Production State: Zero-Vulnerabilities & Cashfree Live"

echo [STEP 5] Connecting to GitHub...
git remote add origin https://github.com/Aman42942/Protocols-Turnaments.git

echo [STEP 6] Force pushing to GitHub (This will clear ALL old history)...
git push -u origin main --force

echo.
echo [DONE] Fresh history reset complete! Check your GitHub repository.
pause
