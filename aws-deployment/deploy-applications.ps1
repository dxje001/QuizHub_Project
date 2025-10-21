# Deploy Applications to EC2 Instances
# This script deploys the monolith and microservices to AWS EC2

param(
    [Parameter(Mandatory=$false)]
    [string]$DeploymentInfoPath = (Join-Path $PSScriptRoot "deployment-info.json")
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "QuizHub Application Deployment" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Load deployment info
if (-not (Test-Path $DeploymentInfoPath)) {
    Write-Host "❌ Deployment info not found: $DeploymentInfoPath" -ForegroundColor Red
    Write-Host "Run deploy-to-aws.ps1 first!" -ForegroundColor Yellow
    exit 1
}

$deployInfo = Get-Content $DeploymentInfoPath | ConvertFrom-Json
Write-Host "✅ Loaded deployment info" -ForegroundColor Green

# Check RDS status
Write-Host "`nChecking RDS database status..." -ForegroundColor Yellow
$dbStatus = aws rds describe-db-instances `
    --db-instance-identifier $deployInfo.DBIdentifier `
    --region $deployInfo.Region `
    --query 'DBInstances[0].DBInstanceStatus' `
    --output text

if ($dbStatus -ne "available") {
    Write-Host "⏳ Database status: $dbStatus" -ForegroundColor Yellow
    Write-Host "Waiting for database to be available..." -ForegroundColor Yellow

    aws rds wait db-instance-available `
        --db-instance-identifier $deployInfo.DBIdentifier `
        --region $deployInfo.Region

    Write-Host "✅ Database is now available!" -ForegroundColor Green
} else {
    Write-Host "✅ Database is available" -ForegroundColor Green
}

# Get RDS endpoint
$dbEndpoint = aws rds describe-db-instances `
    --db-instance-identifier $deployInfo.DBIdentifier `
    --region $deployInfo.Region `
    --query 'DBInstances[0].Endpoint.Address' `
    --output text

Write-Host "✅ Database endpoint: $dbEndpoint" -ForegroundColor Green

# Connection string
$connectionString = "Host=$dbEndpoint;Database=kvizhub;Username=postgres;Password=$($deployInfo.DBPassword)"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 1: Prepare Deployment Package" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Create deployment directory
$deploymentDir = Join-Path $PSScriptRoot "deployment-package"
if (Test-Path $deploymentDir) {
    Remove-Item -Path $deploymentDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deploymentDir | Out-Null

Write-Host "Creating deployment package..." -ForegroundColor Yellow

# Copy necessary files
$projectRoot = Split-Path $PSScriptRoot -Parent
Copy-Item -Path (Join-Path $projectRoot "docker-compose.yml") -Destination $deploymentDir
Copy-Item -Path (Join-Path $projectRoot "docker-compose.microservices-simulation.yml") -Destination $deploymentDir
Copy-Item -Path (Join-Path $projectRoot "backend") -Destination (Join-Path $deploymentDir "backend") -Recurse
Copy-Item -Path (Join-Path $PSScriptRoot "microservices\nginx-simulation.conf") -Destination $deploymentDir

Write-Host "✅ Deployment package created" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 2: Deploy to Monolith EC2" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$keyPath = Join-Path $PSScriptRoot "$($deployInfo.KeyPairName).pem"

Write-Host "Connecting to monolith EC2: $($deployInfo.MonolithPublicIP)" -ForegroundColor Yellow

# Create deployment script for EC2
$monolithSetupScript = @"
#!/bin/bash
set -e

echo "========================================="
echo "Setting up Monolith on EC2"
echo "========================================="

# Update system
echo "Updating system packages..."
sudo apt-get update -qq

# Install Docker
echo "Installing Docker..."
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Clone repository (or upload files)
echo "Setting up application..."
mkdir -p /home/ubuntu/kvizhub
cd /home/ubuntu/kvizhub

# Create .env file
cat > .env <<EOF
POSTGRES_DB=kvizhub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$($deployInfo.DBPassword)
DB_PORT=5432
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long-and-random
JWT_EXPIRY_HOURS=24
VITE_API_URL=http://$($deployInfo.MonolithPublicIP):5000
EOF

echo "✅ Monolith setup complete!"
echo "Upload your code and run: docker-compose up -d"
"@

$setupScriptPath = Join-Path $deploymentDir "setup-monolith.sh"
$monolithSetupScript | Out-File -FilePath $setupScriptPath -Encoding ASCII

Write-Host "Setup script created: $setupScriptPath" -ForegroundColor Cyan

Write-Host "`n⚠️  MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host "To deploy to monolith EC2, you need to:" -ForegroundColor White
Write-Host ""
Write-Host "1. Convert PEM file permissions (if on Windows, skip this)" -ForegroundColor Cyan
Write-Host "2. Upload code to EC2:" -ForegroundColor Cyan
Write-Host "   scp -i `"$keyPath`" -r `"$deploymentDir\*`" ubuntu@$($deployInfo.MonolithPublicIP):/home/ubuntu/kvizhub/" -ForegroundColor Gray
Write-Host ""
Write-Host "3. SSH into EC2:" -ForegroundColor Cyan
Write-Host "   ssh -i `"$keyPath`" ubuntu@$($deployInfo.MonolithPublicIP)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Run setup script:" -ForegroundColor Cyan
Write-Host "   cd /home/ubuntu/kvizhub" -ForegroundColor Gray
Write-Host "   chmod +x setup-monolith.sh" -ForegroundColor Gray
Write-Host "   ./setup-monolith.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Start application:" -ForegroundColor Cyan
Write-Host "   docker-compose up -d" -ForegroundColor Gray
Write-Host ""

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 3: Deploy to Microservices EC2" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Create deployment script for microservices EC2
$microservicesSetupScript = @"
#!/bin/bash
set -e

echo "========================================="
echo "Setting up Microservices on EC2"
echo "========================================="

# Update system
echo "Updating system packages..."
sudo apt-get update -qq

# Install Docker
echo "Installing Docker..."
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Git
echo "Installing Git..."
sudo apt-get install -y git

# Setup application
echo "Setting up application..."
mkdir -p /home/ubuntu/kvizhub
cd /home/ubuntu/kvizhub

# Create .env file
cat > .env <<EOF
POSTGRES_DB=kvizhub
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$($deployInfo.DBPassword)
DB_PORT=5432
ASPNETCORE_ENVIRONMENT=Production
JWT_SECRET=your-super-secure-jwt-secret-key-here-make-it-long-and-random
JWT_EXPIRY_HOURS=24
VITE_API_URL=http://$($deployInfo.MicroservicesPublicIP):8080
EOF

echo "✅ Microservices setup complete!"
echo "Upload your code and run: docker-compose -f docker-compose.microservices-simulation.yml up -d"
"@

$microSetupScriptPath = Join-Path $deploymentDir "setup-microservices.sh"
$microservicesSetupScript | Out-File -FilePath $microSetupScriptPath -Encoding ASCII

Write-Host "Setup script created: $microSetupScriptPath" -ForegroundColor Cyan

Write-Host "`n⚠️  MANUAL STEP REQUIRED:" -ForegroundColor Yellow
Write-Host "To deploy to microservices EC2, you need to:" -ForegroundColor White
Write-Host ""
Write-Host "1. Upload code to EC2:" -ForegroundColor Cyan
Write-Host "   scp -i `"$keyPath`" -r `"$deploymentDir\*`" ubuntu@$($deployInfo.MicroservicesPublicIP):/home/ubuntu/kvizhub/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. SSH into EC2:" -ForegroundColor Cyan
Write-Host "   ssh -i `"$keyPath`" ubuntu@$($deployInfo.MicroservicesPublicIP)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Run setup script:" -ForegroundColor Cyan
Write-Host "   cd /home/ubuntu/kvizhub" -ForegroundColor Gray
Write-Host "   chmod +x setup-microservices.sh" -ForegroundColor Gray
Write-Host "   ./setup-microservices.sh" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Start application:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.microservices-simulation.yml up -d" -ForegroundColor Gray
Write-Host ""

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Deployment Instructions Summary" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

Write-Host "📋 Deployment package ready at: $deploymentDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 SSH Key: $keyPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 EC2 Instances:" -ForegroundColor Yellow
Write-Host "   Monolith:       $($deployInfo.MonolithPublicIP)" -ForegroundColor White
Write-Host "   Microservices:  $($deployInfo.MicroservicesPublicIP)" -ForegroundColor White
Write-Host ""
Write-Host "🗄️  Database:" -ForegroundColor Yellow
Write-Host "   Endpoint: $dbEndpoint" -ForegroundColor White
Write-Host "   Database: kvizhub" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: $($deployInfo.DBPassword)" -ForegroundColor White
Write-Host ""

Write-Host "📝 Save this information!" -ForegroundColor Green
Write-Host ""
