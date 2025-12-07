# Performance Test Runner
# This script runs performance tests on both monolith and microservices

param(
    [switch]$CheckOnly,
    [switch]$MonolithOnly,
    [switch]$MicroservicesOnly
)

$K6_PATH = "C:\Program Files\k6\k6.exe"
$MONOLITH_URL = "http://localhost:8080"
$MICROSERVICES_URL = "http://54.196.182.219"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "QuizHub Performance Testing" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Function to check if a service is running
function Test-Service {
    param($Url, $Name)

    Write-Host "Checking $Name at $Url..." -ForegroundColor Yellow

    try {
        $response = Invoke-WebRequest -Uri "$Url/api/quiz" -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $Name is RUNNING" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "  ✗ $Name is NOT RESPONDING" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check services
Write-Host "Step 1: Checking Services" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

$monolithRunning = Test-Service -Url $MONOLITH_URL -Name "Monolith (Local)"
$microservicesRunning = Test-Service -Url $MICROSERVICES_URL -Name "Microservices (AWS)"

if ($CheckOnly) {
    Write-Host "`nCheck complete!" -ForegroundColor Cyan
    exit
}

Write-Host ""

# Verify K6 is installed
if (-not (Test-Path $K6_PATH)) {
    Write-Host "❌ K6 not found at $K6_PATH" -ForegroundColor Red
    Write-Host "Please install K6 first" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 2: Running Performance Tests" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

# Run tests based on parameters
if (-not $MicroservicesOnly -and $monolithRunning) {
    Write-Host "`n📊 Testing MONOLITH (Local)..." -ForegroundColor Yellow
    Write-Host "This will take approximately 3.5 minutes...`n" -ForegroundColor Gray

    & $K6_PATH run ".\test-monolith.js"

    Write-Host "`n✓ Monolith test complete!" -ForegroundColor Green
    Write-Host "Results saved to: monolith-results.json`n" -ForegroundColor Gray
} elseif (-not $MicroservicesOnly) {
    Write-Host "`n⚠️  Skipping monolith test - service not running" -ForegroundColor Yellow
    Write-Host "Start your local monolith with: docker-compose up -d`n" -ForegroundColor Gray
}

if (-not $MonolithOnly -and $microservicesRunning) {
    Write-Host "`n📊 Testing MICROSERVICES (AWS)..." -ForegroundColor Yellow
    Write-Host "This will take approximately 3.5 minutes...`n" -ForegroundColor Gray

    & $K6_PATH run ".\test-microservices.js"

    Write-Host "`n✓ Microservices test complete!" -ForegroundColor Green
    Write-Host "Results saved to: microservices-results.json`n" -ForegroundColor Gray
} elseif (-not $MonolithOnly) {
    Write-Host "`n⚠️  Skipping microservices test - service not running" -ForegroundColor Yellow
    Write-Host "Check your AWS EC2 instance at http://54.196.182.219`n" -ForegroundColor Gray
}

# Generate comparison if both tests ran
if ((Test-Path ".\monolith-results.json") -and (Test-Path ".\microservices-results.json")) {
    Write-Host "`nStep 3: Generating Comparison Report" -ForegroundColor Cyan
    Write-Host "─────────────────────────────────────────`n" -ForegroundColor Gray

    # Run comparison script
    if (Test-Path ".\compare-results.ps1") {
        & ".\compare-results.ps1"
    } else {
        Write-Host "⚠️  Comparison script not found. Results are available in JSON files." -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the results in the JSON files" -ForegroundColor White
Write-Host "  2. Run .\compare-results.ps1 to generate comparison report" -ForegroundColor White
Write-Host "  3. Use the data for your thesis documentation`n" -ForegroundColor White
