@echo off
echo Installing shared module dependencies...
cd shared
call npm install
if %errorlevel% neq 0 (
    echo Failed to install shared module dependencies
    exit /b %errorlevel%
)
cd ..

echo Installing child app dependencies...
cd child-app
call npm install
if %errorlevel% neq 0 (
    echo Failed to install child app dependencies
    exit /b %errorlevel%
)

echo Installing parent app dependencies...
cd parent-app
call npm install
if %errorlevel% neq 0 (
    echo Failed to install parent app dependencies
    exit /b %errorlevel%
)
cd ..

echo Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo Failed to install server dependencies
    exit /b %errorlevel%
)
cd ..

REM Start server first
start "" "%~dp0run-server.bat"
timeout /t 3 >nul

REM Start child then parent with sync env configured inside each script
start "" "%~dp0run-child.bat"
timeout /t 3 >nul
start "" "%~dp0run-parent.bat"

echo Server and both apps starting...
echo API server: http://localhost:5050
echo Child app:  http://localhost:5173
echo Parent app: http://localhost:5174
