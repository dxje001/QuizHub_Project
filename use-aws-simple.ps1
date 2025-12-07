# Switch Frontend to AWS Microservices

Write-Host "Switching to AWS Microservices..." -ForegroundColor Cyan
Copy-Item -Path "frontend\.env.aws" -Destination "frontend\.env" -Force
Write-Host "Done! Frontend configured for AWS" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: http://54.196.182.219" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
