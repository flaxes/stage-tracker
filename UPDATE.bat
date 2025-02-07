@echo off

echo Updating...

del package-lock.json

git pull

npm install --production

echo Done.

timeout 2