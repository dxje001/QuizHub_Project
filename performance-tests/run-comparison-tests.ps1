# Comprehensive Performance Testing Suite
# Compares Monolith vs Microservices under different user loads

param(
    [switch]$SkipMonolith,
    [switch]$SkipMicroservices,
    [int]$MaxUsers = 50
)

$K6_PATH = "C:\Program Files\k6\k6.exe"
$MONOLITH_URL = "http://localhost:5000"
$MICROSERVICES_URL = "http://44.208.207.182"

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  QuizHub Performance Comparison Testing   ║" -ForegroundColor Cyan
Write-Host "║  Monolith vs Microservices                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Test scenarios
$scenarios = @(
    @{ Name = "light_load"; Users = 5; Duration = "2m"; Description = "Light Load (5 users)" },
    @{ Name = "medium_load"; Users = 20; Duration = "2m"; Description = "Medium Load (20 users)" },
    @{ Name = "heavy_load"; Users = 50; Duration = "2m"; Description = "Heavy Load (50 users)" }
)

# Function to run test
function Run-Test {
    param($Architecture, $URL, $Scenario)

    Write-Host "`n📊 Testing: $Architecture - $($Scenario.Description)" -ForegroundColor Yellow
    Write-Host "   URL: $URL" -ForegroundColor Gray
    Write-Host "   Users: $($Scenario.Users) | Duration: $($Scenario.Duration)" -ForegroundColor Gray
    Write-Host ""

    $env:BASE_URL = $URL
    $env:TEST_NAME = $Architecture
    $env:SCENARIO = $Scenario.Name

    & $K6_PATH run test-scenarios.js

    Write-Host "`n✓ Test completed!" -ForegroundColor Green
}

# Check K6 is installed
if (-not (Test-Path $K6_PATH)) {
    Write-Host "❌ K6 not found at $K6_PATH" -ForegroundColor Red
    exit 1
}

# Check monolith is running
if (-not $SkipMonolith) {
    Write-Host "Checking monolith availability..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$MONOLITH_URL/api/quiz" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ Monolith is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Monolith is not responding at $MONOLITH_URL" -ForegroundColor Red
        Write-Host "   Start it with: docker-compose up -d" -ForegroundColor Yellow
        $response = Read-Host "`nContinue without monolith tests? (y/n)"
        if ($response -ne 'y') { exit 1 }
        $SkipMonolith = $true
    }
}

# Check microservices are running
if (-not $SkipMicroservices) {
    Write-Host "Checking microservices availability..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$MICROSERVICES_URL/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ Microservices are running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Microservices are not responding at $MICROSERVICES_URL" -ForegroundColor Red
        Write-Host "   Check your AWS EC2 instance" -ForegroundColor Yellow
        $response = Read-Host "`nContinue without microservices tests? (y/n)"
        if ($response -ne 'y') { exit 1 }
        $SkipMicroservices = $true
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$totalTests = 0
$completedTests = 0

# Count total tests
foreach ($scenario in $scenarios) {
    if (-not $SkipMonolith) { $totalTests++ }
    if (-not $SkipMicroservices) { $totalTests++ }
}

Write-Host "Total tests to run: $totalTests" -ForegroundColor White
Write-Host "Estimated time: $($totalTests * 2) minutes`n" -ForegroundColor Gray

# Run tests for each scenario
foreach ($scenario in $scenarios) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host " SCENARIO: $($scenario.Description)" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

    # Test Monolith
    if (-not $SkipMonolith) {
        Run-Test -Architecture "monolith" -URL $MONOLITH_URL -Scenario $scenario
        $completedTests++
        Write-Host "`nProgress: $completedTests/$totalTests tests completed" -ForegroundColor Gray
        Start-Sleep -Seconds 10  # Cool-down period
    }

    # Test Microservices
    if (-not $SkipMicroservices) {
        Run-Test -Architecture "microservices" -URL $MICROSERVICES_URL -Scenario $scenario
        $completedTests++
        Write-Host "`nProgress: $completedTests/$totalTests tests completed" -ForegroundColor Gray
        Start-Sleep -Seconds 10  # Cool-down period
    }
}

Write-Host "`n╔════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║          ALL TESTS COMPLETED! ✓            ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "Results saved in JSON files:" -ForegroundColor Cyan
Get-ChildItem -Path "." -Filter "results-*.json" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}

Write-Host "`n📈 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: python analyze-results.py" -ForegroundColor White
Write-Host "  2. Check: comparison-report.html" -ForegroundColor White
Write-Host "  3. Include graphs in your thesis!`n" -ForegroundColor White
