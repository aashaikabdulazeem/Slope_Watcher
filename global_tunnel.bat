@echo off
echo ===================================================================
echo   LandSlide Sentinel - Public Global Host Generator
echo ===================================================================
echo.
echo [1] Local Network IP (Available immediately on your Wi-Fi/LAN):
echo     http://192.168.1.9:5173
echo.
echo [2] Generating instant public HTTPS tunnel via Localtunnel...
echo     (Share this URL with anyone on the internet!)
echo.
call npx --yes localtunnel --port 5173
pause
