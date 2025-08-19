@echo off
echo Starting Zemenay Development Environment...
echo.

echo Starting Backend (NestJS) on port 3001...
start "Backend" cmd /k "cd zemenay_back && npm run start:dev"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Frontend (Next.js) on port 3000...
start "Frontend" cmd /k "cd zemenay_front && npm run dev"

echo.
echo Development servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:3001/api
echo.
echo Press any key to exit this script (servers will continue running)
pause > nul 