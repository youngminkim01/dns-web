@echo off
set "hosts=%WinDir%\System32\drivers\etc\hosts"

:: 관리자 권한 체크
openfiles >nul 2>&1
if '%errorlevel%' NEQ '0' (
    echo 관리자 권한이 필요합니다. 관리자 권한으로 다시 실행합니다...
    powershell -Command "Start-Process -FilePath '%0' -Verb RunAs"
    exit /b
)

:: 올바르지 않은 부분 (PDMSERVER192.168.10.243 dns.aproele.com) 이 있는지 확인하고 수정합니다.
powershell -Command "$content = Get-Content '%hosts%' -Raw; $content = $content -replace 'PDMSERVER192.168.10.243\s+dns\.aproele\.com', \"PDMSERVER`r`n192.168.10.243 dns.aproele.com\"; Set-Content -Path '%hosts%' -Value $content -NoNewline"

echo.
echo ===================================================
echo 호스트(hosts) 파일 수정이 성공적으로 완료되었습니다!
echo теперь "dns.aproele.com" 로 정상 접속이 가능합니다.
echo ===================================================
echo.
pause
