# Script to remove large zip files from git history
Write-Host "Removing large files from git history..." -ForegroundColor Yellow

# Remove the files from all commits
git filter-branch --force --index-filter `
  "git rm -rf --cached --ignore-unmatch frontend.zip backend.zip *.zip" `
  --prune-empty --tag-name-filter cat -- --all

Write-Host "Cleaning up..." -ForegroundColor Yellow
# Remove backup refs
Remove-Item -Recurse -Force .git/refs/original/ -ErrorAction SilentlyContinue

# Expire reflog
git reflog expire --expire=now --all

# Garbage collect
git gc --prune=now --aggressive

Write-Host "Done! Now you can push to GitHub." -ForegroundColor Green
Write-Host "Run: git push origin main --force" -ForegroundColor Cyan
