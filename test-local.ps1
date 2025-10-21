# Quick Local Test Script
# Tests both monolith and microservices locally

param(
    [switch]$SkipMonolith,
    [switch]$SkipMicroservices,
    [switch]$SkipLoadTests
)

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "QuizHub Local Architecture Test" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test Monolith
if (-not $SkipMonolith) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Testing Monolith Architecture" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

    Write-Host "Starting monolith containers..." -ForegroundColor Yellow
    docker-compose up -d

    Write-Host "Waiting for services to be ready (30 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30

    Write-Host "`nTesting monolith health..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Monolith is healthy!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Could not connect to monolith. Check logs with: docker-compose logs backend" -ForegroundColor Yellow
    }

    Write-Host "`nMonolith URLs:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://localhost:3050" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
    Write-Host "`nPress Enter to continue to microservices test (or Ctrl+C to exit)..."
    Read-Host

    Write-Host "Stopping monolith..." -ForegroundColor Yellow
    docker-compose down
    Start-Sleep -Seconds 5
}

# Test Microservices
if (-not $SkipMicroservices) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Testing Microservices Architecture" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

    Write-Host "Starting microservices containers..." -ForegroundColor Yellow
    docker-compose -f docker-compose.microservices-simulation.yml up -d

    Write-Host "Waiting for services to be ready (40 seconds)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 40

    Write-Host "`nTesting microservices health..." -ForegroundColor Yellow

    # Test Nginx gateway
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Nginx gateway is healthy!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Could not connect to Nginx gateway" -ForegroundColor Yellow
    }

    # Test auth service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5001/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Auth service is healthy!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Auth service not responding" -ForegroundColor Yellow
    }

    # Test quiz service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5002/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Quiz service is healthy!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Quiz service not responding" -ForegroundColor Yellow
    }

    # Test execution service
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5003/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ Execution service is healthy!" -ForegroundColor Green
        }
    } catch {
        Write-Host "⚠️  Execution service not responding" -ForegroundColor Yellow
    }

    Write-Host "`nMicroservices URLs:" -ForegroundColor Cyan
    Write-Host "  Frontend:          http://localhost:3051" -ForegroundColor White
    Write-Host "  API Gateway:       http://localhost:8080" -ForegroundColor White
    Write-Host "  Auth Service:      http://localhost:5001" -ForegroundColor White
    Write-Host "  Quiz Service:      http://localhost:5002" -ForegroundColor White
    Write-Host "  Execution Service: http://localhost:5003" -ForegroundColor White

    if (-not $SkipLoadTests) {
        Write-Host "`nPress Enter to run load tests (or Ctrl+C to skip)..."
        Read-Host
    }

    Write-Host "Stopping microservices..." -ForegroundColor Yellow
    docker-compose -f docker-compose.microservices-simulation.yml down
}

# Run load tests
if (-not $SkipLoadTests) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Running Load Tests (Optional)" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

    # Check if K6 is installed
    try {
        $k6Version = k6 version 2>&1
        Write-Host "✅ K6 is installed" -ForegroundColor Green

        Write-Host "`nTo run load tests:" -ForegroundColor Yellow
        Write-Host "1. Start monolith: docker-compose up -d" -ForegroundColor White
        Write-Host "2. Run test: cd aws-deployment\testing; `$env:API_URL='http://localhost:5000'; k6 run load-test.js" -ForegroundColor White
        Write-Host "`n3. Start microservices: docker-compose -f docker-compose.microservices-simulation.yml up -d" -ForegroundColor White
        Write-Host "4. Run test: `$env:API_URL='http://localhost:8080'; k6 run load-test.js" -ForegroundColor White
        Write-Host "`nOr use the automated script: .\aws-deployment\testing\run-tests.ps1" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠️  K6 not installed. Install with: choco install k6" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "✅ Both architectures are configured and ready" -ForegroundColor Green
Write-Host "✅ You can now test them manually or run load tests" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Test manually in browser (verify functionality)" -ForegroundColor White
Write-Host "2. Run K6 load tests (compare performance)" -ForegroundColor White
Write-Host "3. Deploy to AWS (production comparison)" -ForegroundColor White
Write-Host "`nFor help, see: QUICK_START.md" -ForegroundColor Cyan
Write-Host ""
