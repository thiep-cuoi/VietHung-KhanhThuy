@echo off
cd /d "%~dp0"
echo Mo trinh duyet tai http://localhost:8080
echo Nhan Ctrl+C de dung.
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server 8080 --directory docs
) else (
  python -m http.server 8080 --directory docs
)
pause
