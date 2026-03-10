$hostsPath = "C:\Windows\System32\drivers\etc\hosts"
$content = Get-Content $hostsPath -Raw
$content = $content.Replace("PDMSERVER192.168.10.243", "PDMSERVER`r`n192.168.10.243")
Set-Content -Path $hostsPath -Value $content -NoNewline
Write-Host "hosts 파일이 수정되었습니다. 창을 닫아주세요."
Start-Sleep -Seconds 3
