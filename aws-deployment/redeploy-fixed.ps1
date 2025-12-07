# Redeploy with Fixed Configuration
# This script updates the deployment with correct port mappings

param(
    [string]$EC2IP = "54.196.182.219",
    [string]$KeyPath = "aws-deployment\kvizhub-key-v2.pem"
)

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "Redeploying with Fixed Configuration" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Yellow

# Upload fixed nginx config
Write-Host "📤 Uploading fixed Nginx configuration..." -ForegroundColor Cyan
scp -i $KeyPath aws-deployment/nginx-aws.conf ubuntu@${EC2IP}:~/kvizhub/nginx-aws.conf

# Upload fixed docker-compose
Write-Host "📤 Uploading fixed Docker Compose file..." -ForegroundColor Cyan
scp -i $KeyPath aws-deployment/docker-compose-fixed.yml ubuntu@${EC2IP}:~/kvizhub/docker-compose.yml

# Restart services
Write-Host "`n🔄 Restarting services with new configuration..." -ForegroundColor Cyan

$redeployScript = @'
cd ~/kvizhub

echo "Stopping current containers..."
docker compose down

echo ""
echo "Starting services with fixed configuration..."
docker compose up -d

echo ""
echo "Waiting for services to start..."
sleep 45

echo ""
echo "Checking container status:"
docker ps

echo ""
echo "Testing services:"
echo ""
echo "Gateway health:"
curl -s http://localhost/health || echo "Gateway not ready"

echo ""
echo "Auth service (direct):"
curl -s http://localhost:5001/ || echo "Auth service not responding"

echo ""
echo "Quiz service (direct):"
curl -s http://localhost:5002/ || echo "Quiz service not responding"

echo ""
echo "Execution service (direct):"
curl -s http://localhost:5003/ || echo "Execution service not responding"

echo ""
echo "Checking logs for errors..."
echo "--- Auth Service Last 10 Lines ---"
docker logs auth-service --tail 10

echo ""
echo "--- Quiz Service Last 10 Lines ---"
docker logs quiz-service --tail 10

echo ""
echo "--- Execution Service Last 10 Lines ---"
docker logs execution-service --tail 10
'@

ssh -i $KeyPath ubuntu@$EC2IP $redeployScript

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ REDEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "Test the deployment:" -ForegroundColor Cyan
Write-Host "  curl http://$EC2IP/health" -ForegroundColor White
Write-Host "  curl http://$EC2IP:5001/" -ForegroundColor White
Write-Host "  curl http://$EC2IP:5002/" -ForegroundColor White
Write-Host "  curl http://$EC2IP:5003/" -ForegroundColor White
Write-Host ""
