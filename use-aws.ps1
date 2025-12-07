# Switch Frontend to AWS Microservices
# This script configures the frontend to use AWS microservices backend

Write-Host "`n🌐 Switching to AWS Microservices..." -ForegroundColor Cyan

# Copy AWS configuration
Copy-Item -Path "frontend\.env.aws" -Destination "frontend\.env" -Force

Write-Host "✓ Frontend configured for AWS Microservices" -ForegroundColor Green
Write-Host "`nBackend URL: http://54.196.182.219" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. cd frontend" -ForegroundColor White
Write-Host "  2. npm run dev" -ForegroundColor White
Write-Host "  3. Open http://localhost:5173 in browser`n" -ForegroundColor White

# Verify AWS is accessible
Write-Host "Checking AWS microservices..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://54.196.182.219/health" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ AWS Microservices are ONLINE and ready!" -ForegroundColor Green
    }
}
catch {
    Write-Host "⚠️  Warning: Could not reach AWS microservices" -ForegroundColor Red
    Write-Host "   Check if EC2 instance is running in AWS Console" -ForegroundColor Yellow
}

Write-Host ""
