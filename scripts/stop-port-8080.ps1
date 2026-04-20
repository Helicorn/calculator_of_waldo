$ErrorActionPreference = "SilentlyContinue"
$conns = Get-NetTCPConnection -LocalPort 8080 -State Listen
if (-not $conns) {
  Write-Host "8080 포트에서 LISTEN 중인 프로세스가 없습니다."
  exit 0
}
foreach ($c in @($conns)) {
  $procId = $c.OwningProcess
  Write-Host "PID $procId 종료 중..."
  Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}
Write-Host "완료."
