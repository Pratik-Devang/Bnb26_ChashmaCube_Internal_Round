$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$apiPython = Join-Path $projectRoot "relearn-api\.venv\Scripts\python.exe"
$apiDirectory = Join-Path $projectRoot "relearn-api"
$apiOut = Join-Path $projectRoot "backend-uvicorn.out.log"
$apiError = Join-Path $projectRoot "backend-uvicorn.err.log"

if (-not (Test-Path -LiteralPath $apiPython)) {
  throw "The backend virtual environment is missing. Follow relearn-api/README.md before starting the full app."
}

$apiIsReady = $false
try {
  $null = Invoke-WebRequest -UseBasicParsing "http://localhost:8000/health" -TimeoutSec 2
  $apiIsReady = $true
} catch {
  $apiIsReady = $false
}

if (-not $apiIsReady) {
  Start-Process -FilePath $apiPython `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" `
    -WorkingDirectory $apiDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $apiOut `
    -RedirectStandardError $apiError

  for ($attempt = 0; $attempt -lt 20; $attempt += 1) {
    Start-Sleep -Milliseconds 250
    try {
      $null = Invoke-WebRequest -UseBasicParsing "http://localhost:8000/health" -TimeoutSec 2
      $apiIsReady = $true
      break
    } catch {
      $apiIsReady = $false
    }
  }
}

if (-not $apiIsReady) {
  if (Test-Path -LiteralPath $apiError) { Get-Content -LiteralPath $apiError -Tail 40 }
  throw "The backend did not become ready on http://localhost:8000."
}

Write-Host "Re:Learn API is ready at http://localhost:8000"
Set-Location -LiteralPath $projectRoot
npm run dev
