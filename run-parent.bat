@echo off
echo Installing shared module dependencies...
cd shared
call npm install
if %errorlevel% neq 0 (
    echo Failed to install shared module dependencies
    exit /b %errorlevel%
)
cd ..

echo Installing parent app dependencies...
cd parent-app
call npm install
if %errorlevel% neq 0 (
    echo Failed to install parent app dependencies
    exit /b %errorlevel%
)
REM Start parent app with server sync enabled (if server is running)
start "" cmd /k "set VITE_ENABLE_SYNC=true && set VITE_API_BASE_URL=http://localhost:5050 && npm run dev"
