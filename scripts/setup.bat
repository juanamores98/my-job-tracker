@echo off
echo Setting up Job Tracker application...

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js is not installed. Please install Node.js 18.x or later.
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
call npm install

:: Create environment file if it doesn't exist
if not exist .env.local (
    echo Creating .env.local file...
    copy .env.local.example .env.local
    echo Please edit .env.local with your configuration if needed.
)

:: Build the project
echo Building the project...
call npm run build

echo Setup complete! You can now run the development server with:
echo npm run dev
echo Then open http://localhost:3000 in your browser.
