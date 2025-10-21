# Upload and Deploy Microservices to EC2
# This script uploads all necessary files and starts the microservices

param(
    [string]$EC2IP = "54.196.182.219",
    [string]$KeyPath = "aws-deployment\kvizhub-key-v2.pem"
)

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deploying Microservices to AWS EC2" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "EC2 IP: $EC2IP" -ForegroundColor Cyan
Write-Host "SSH Key: $KeyPath`n" -ForegroundColor Cyan

# Wait for Docker to be installed (from user-data script)
Write-Host "⏳ Waiting 30 seconds for EC2 boot and Docker installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Test SSH connection
Write-Host "`n📡 Testing SSH connection..." -ForegroundColor Cyan
$sshTest = ssh -i $KeyPath -o StrictHostKeyChecking=no -o ConnectTimeout=10 ubuntu@$EC2IP "echo 'Connected'" 2>&1

if ($sshTest -match "Connected") {
    Write-Host "✅ SSH connection successful!" -ForegroundColor Green
} else {
    Write-Host "⚠️  SSH not ready yet. Waiting 30 more seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
}

# Create deployment directory on EC2
Write-Host "`n📁 Creating application directory on EC2..." -ForegroundColor Cyan
ssh -i $KeyPath ubuntu@$EC2IP "mkdir -p ~/kvizhub/backend && mkdir -p ~/kvizhub/aws-deployment"

# Upload backend code
Write-Host "`n📤 Uploading backend code (this may take 2-3 minutes)..." -ForegroundColor Cyan
scp -i $KeyPath -r backend/* ubuntu@${EC2IP}:~/kvizhub/backend/

# Upload docker-compose and nginx config
Write-Host "`n📤 Uploading Docker Compose configuration..." -ForegroundColor Cyan
scp -i $KeyPath aws-deployment/docker-compose-aws.yml ubuntu@${EC2IP}:~/kvizhub/docker-compose.yml
scp -i $KeyPath aws-deployment/nginx-aws.conf ubuntu@${EC2IP}:~/kvizhub/nginx-aws.conf

# Deploy and start services
Write-Host "`n🚀 Starting microservices on EC2..." -ForegroundColor Cyan

$deployScript = @'
cd ~/kvizhub

echo "Building and starting microservices..."
docker compose up -d --build

echo ""
echo "Waiting for services to start..."
sleep 30

echo ""
echo "Checking running containers:"
docker ps

echo ""
echo "Testing services:"
curl -s http://localhost/health || echo "Nginx not ready yet"
curl -s http://localhost:5001/health || echo "Auth service not ready yet"
curl -s http://localhost:5002/health || echo "Quiz service not ready yet"
curl -s http://localhost:5003/health || echo "Execution service not ready yet"

echo ""
echo "✅ Deployment complete!"
echo "Services are starting up (may take 2-3 minutes to be fully ready)"
'@

ssh -i $KeyPath ubuntu@$EC2IP $deployScript

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "🌐 Microservices URLs:" -ForegroundColor Cyan
Write-Host "  Gateway:  http://$EC2IP" -ForegroundColor White
Write-Host "  Health:   http://$EC2IP/health" -ForegroundColor White
Write-Host "  Auth:     http://$EC2IP/api/auth" -ForegroundColor White
Write-Host "  Quiz:     http://$EC2IP/api/quiz" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Services are starting (wait 2-3 minutes for full startup)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Test the deployment:" -ForegroundColor Green
Write-Host "  curl http://$EC2IP/health" -ForegroundColor White
Write-Host ""
