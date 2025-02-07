@echo off

echo Updating...

del package-lock.json

git pull

call npm install --production

echo Done. Please restart program. Close this window or wait.

timeout 2