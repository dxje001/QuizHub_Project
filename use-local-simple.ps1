# Switch Frontend to Local Monolith

Write-Host "Switching to Local Monolith..." -ForegroundColor Cyan
Copy-Item -Path "frontend\.env.local" -Destination "frontend\.env" -Force
Write-Host "Done! Frontend configured for Local" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: http://localhost:8080" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: docker-compose up -d && cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
