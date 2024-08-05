@echo off

echo Updating...

git pull

npm install --production

echo Done.

timeout 2