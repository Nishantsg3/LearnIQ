@echo off
echo ========================================================
echo [LearnIQ] System Prep
echo Safely shutting down any ghost servers running backwards...
echo ========================================================
taskkill /F /IM java.exe /T >nul 2>&1
taskkill /F /IM javaw.exe /T >nul 2>&1

FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :8080') DO (
    taskkill /F /PID %%T /T >nul 2>&1
)

timeout /t 2 /nobreak >nul

echo.
echo ========================================================
echo [LearnIQ] Starting Core Backend...
echo This will take a few seconds cleanly!
echo ========================================================
cd learniq-backend
mvn spring-boot:run
