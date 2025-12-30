@echo off
echo Initializing the entire project...

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
cd ..

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

echo Project initialization complete!
echo You can now run:
echo  - run-server.bat to start the API server
echo  - run-child.bat to start the child app (sync enabled)
echo  - run-parent.bat to start the parent app (sync enabled)
echo  - run-both.bat to start server + both apps
