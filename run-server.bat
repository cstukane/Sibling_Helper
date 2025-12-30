@echo off
echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    exit /b %errorlevel%
)
start "" cmd /k "npm run dev"

