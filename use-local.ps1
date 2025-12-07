# Switch Frontend to Local Monolith
# This script configures the frontend to use local monolith backend

Write-Host "`n💻 Switching to Local Monolith..." -ForegroundColor Cyan

# Copy local configuration
Copy-Item -Path "frontend\.env.local" -Destination "frontend\.env" -Force

Write-Host "✓ Frontend configured for Local Monolith" -ForegroundColor Green
Write-Host "`nBackend URL: http://localhost:8080" -ForegroundColor Yellow
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure Docker is running" -ForegroundColor White
Write-Host "  2. docker-compose up -d" -ForegroundColor White
Write-Host "  3. cd frontend" -ForegroundColor White
Write-Host "  4. npm run dev" -ForegroundColor White
Write-Host "  5. Open http://localhost:5173 in browser`n" -ForegroundColor White

# Check if Docker is running
Write-Host "Checking local services..." -ForegroundColor Yellow

try {
    $dockerCheck = docker ps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Docker is running" -ForegroundColor Green

        # Check if backend is running
        if ($dockerCheck -match "backend" -or $dockerCheck -match "kvizhub") {
            Write-Host "✓ Backend containers are running" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Backend containers not found" -ForegroundColor Yellow
            Write-Host "   Run: docker-compose up -d" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "⚠️  Docker might not be running" -ForegroundColor Yellow
    Write-Host "   Start Docker Desktop first" -ForegroundColor Yellow
}

Write-Host ""
