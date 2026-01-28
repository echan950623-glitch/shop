@echo off
echo ===================================================
echo   啟動購物網站測試伺服器 (Starting Server...)
echo ===================================================
echo.
cd /d "%~dp0"

echo 正在啟動... (請勿關閉此視窗)
echo 按住 Ctrl + 點擊下方連結即可開啟網頁
echo.

call npm run dev

pause
