# AWS Deployment Script - Microservices Only
# Deploy only microservices architecture to AWS (monolith stays local)

param(
    [Parameter(Mandatory=$false)]
    [string]$KeyPairName = "kvizhub-key",

    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",

    [Parameter(Mandatory=$false)]
    [string]$DBPassword = "KvizHub2024SecurePassword!"
)

$ErrorActionPreference = "Stop"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "QuizHub Microservices AWS Deployment" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check AWS CLI is configured
Write-Host "Checking AWS CLI configuration..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity | ConvertFrom-Json
    Write-Host "✅ Authenticated as: $($identity.Arn)" -ForegroundColor Green
    Write-Host "   Account: $($identity.Account)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ AWS CLI not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 1: Create SSH Key Pair" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Check if key pair already exists
$existingKey = aws ec2 describe-key-pairs --key-names $KeyPairName --region $Region 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Key pair '$KeyPairName' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to use existing key? (Y/N)"
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "Please delete the existing key pair or use a different name" -ForegroundColor Red
        exit 1
    }
    $keyPath = Join-Path $PSScriptRoot "$KeyPairName.pem"
} else {
    Write-Host "Creating new key pair: $KeyPairName" -ForegroundColor Yellow

    # Create key pair and save to file
    $keyMaterial = aws ec2 create-key-pair `
        --key-name $KeyPairName `
        --region $Region `
        --query 'KeyMaterial' `
        --output text

    if ($LASTEXITCODE -eq 0) {
        # Save key to file
        $keyPath = Join-Path $PSScriptRoot "$KeyPairName.pem"
        $keyMaterial | Out-File -FilePath $keyPath -Encoding ASCII -NoNewline

        Write-Host "✅ Key pair created and saved to: $keyPath" -ForegroundColor Green
        Write-Host "⚠️  Keep this file safe! You'll need it to SSH into EC2" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Failed to create key pair" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 2: Create Security Groups" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Get default VPC
Write-Host "Getting default VPC..." -ForegroundColor Yellow
$vpcId = aws ec2 describe-vpcs `
    --region $Region `
    --filters "Name=isDefault,Values=true" `
    --query 'Vpcs[0].VpcId' `
    --output text

if ([string]::IsNullOrWhiteSpace($vpcId) -or $vpcId -eq "None") {
    Write-Host "❌ No default VPC found. Creating one..." -ForegroundColor Yellow
    aws ec2 create-default-vpc --region $Region | Out-Null
    Start-Sleep -Seconds 5

    $vpcId = aws ec2 describe-vpcs `
        --region $Region `
        --filters "Name=isDefault,Values=true" `
        --query 'Vpcs[0].VpcId' `
        --output text
}

Write-Host "✅ Using VPC: $vpcId" -ForegroundColor Green

# Create security group for EC2
$sgName = "kvizhub-microservices-sg"
Write-Host "`nCreating security group: $sgName" -ForegroundColor Yellow

$existingSG = aws ec2 describe-security-groups `
    --region $Region `
    --filters "Name=group-name,Values=$sgName" `
    --query 'SecurityGroups[0].GroupId' `
    --output text 2>&1

if ($existingSG -and $existingSG -ne "None") {
    Write-Host "⚠️  Security group already exists: $existingSG" -ForegroundColor Yellow
    $ec2SgId = $existingSG
} else {
    $ec2SgId = aws ec2 create-security-group `
        --group-name $sgName `
        --description "Security group for QuizHub Microservices EC2" `
        --vpc-id $vpcId `
        --region $Region `
        --query 'GroupId' `
        --output text

    Write-Host "✅ Created security group: $ec2SgId" -ForegroundColor Green

    # Add inbound rules
    Write-Host "Adding inbound rules..." -ForegroundColor Yellow

    # SSH
    aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region $Region 2>&1 | Out-Null
    # HTTP
    aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region $Region 2>&1 | Out-Null
    # HTTPS
    aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 443 --cidr 0.0.0.0/0 --region $Region 2>&1 | Out-Null
    # Backend services
    aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 5000-5010 --cidr 0.0.0.0/0 --region $Region 2>&1 | Out-Null
    # Nginx
    aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region $Region 2>&1 | Out-Null

    Write-Host "✅ Security group rules configured" -ForegroundColor Green
}

# Create security group for RDS
$rdsSgName = "kvizhub-rds-sg"
Write-Host "`nCreating security group for RDS: $rdsSgName" -ForegroundColor Yellow

$existingRDSSG = aws ec2 describe-security-groups `
    --region $Region `
    --filters "Name=group-name,Values=$rdsSgName" `
    --query 'SecurityGroups[0].GroupId' `
    --output text 2>&1

if ($existingRDSSG -and $existingRDSSG -ne "None") {
    Write-Host "⚠️  RDS security group already exists: $existingRDSSG" -ForegroundColor Yellow
    $rdsSgId = $existingRDSSG
} else {
    $rdsSgId = aws ec2 create-security-group `
        --group-name $rdsSgName `
        --description "Security group for QuizHub RDS database" `
        --vpc-id $vpcId `
        --region $Region `
        --query 'GroupId' `
        --output text

    Write-Host "✅ Created RDS security group: $rdsSgId" -ForegroundColor Green

    # Allow PostgreSQL from EC2 security group
    aws ec2 authorize-security-group-ingress --group-id $rdsSgId --protocol tcp --port 5432 --source-group $ec2SgId --region $Region 2>&1 | Out-Null
    # Also allow from anywhere (for testing)
    aws ec2 authorize-security-group-ingress --group-id $rdsSgId --protocol tcp --port 5432 --cidr 0.0.0.0/0 --region $Region 2>&1 | Out-Null

    Write-Host "✅ RDS security group rules configured" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 3: Launch EC2 Instance" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Get latest Ubuntu AMI
Write-Host "Finding latest Ubuntu 22.04 AMI..." -ForegroundColor Yellow
$amiId = aws ec2 describe-images `
    --region $Region `
    --owners 099720109477 `
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" `
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' `
    --output text

Write-Host "✅ Using AMI: $amiId" -ForegroundColor Green

# Launch EC2 for Microservices
Write-Host "`nLaunching EC2 instance for MICROSERVICES..." -ForegroundColor Yellow

$instanceId = aws ec2 run-instances `
    --image-id $amiId `
    --instance-type t2.micro `
    --key-name $KeyPairName `
    --security-group-ids $ec2SgId `
    --region $Region `
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kvizhub-microservices},{Key=Project,Value=QuizHub},{Key=Architecture,Value=Microservices}]' `
    --query 'Instances[0].InstanceId' `
    --output text

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Microservices EC2 launched: $instanceId" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to launch EC2" -ForegroundColor Red
    exit 1
}

# Wait for instance to be running
Write-Host "`nWaiting for EC2 instance to be running (1-2 minutes)..." -ForegroundColor Yellow
aws ec2 wait instance-running --instance-ids $instanceId --region $Region

Write-Host "✅ EC2 instance is running!" -ForegroundColor Green

# Get public IP
$publicIp = aws ec2 describe-instances `
    --instance-ids $instanceId `
    --region $Region `
    --query 'Reservations[0].Instances[0].PublicIpAddress' `
    --output text

Write-Host "`nEC2 Instance Details:" -ForegroundColor Cyan
Write-Host "  Instance ID: $instanceId" -ForegroundColor White
Write-Host "  Public IP:   $publicIp" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Step 4: Create RDS Database" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

$dbIdentifier = "kvizhub-db"
Write-Host "Creating RDS PostgreSQL database: $dbIdentifier" -ForegroundColor Yellow

$existingDB = aws rds describe-db-instances `
    --db-instance-identifier $dbIdentifier `
    --region $Region `
    --query 'DBInstances[0].DBInstanceIdentifier' `
    --output text 2>&1

if ($existingDB -and $existingDB -ne "None") {
    Write-Host "⚠️  Database already exists: $dbIdentifier" -ForegroundColor Yellow

    # Get endpoint
    $dbEndpoint = aws rds describe-db-instances `
        --db-instance-identifier $dbIdentifier `
        --region $Region `
        --query 'DBInstances[0].Endpoint.Address' `
        --output text

    Write-Host "✅ Using existing database" -ForegroundColor Green
    Write-Host "   Endpoint: $dbEndpoint" -ForegroundColor Cyan
} else {
    aws rds create-db-instance `
        --db-instance-identifier $dbIdentifier `
        --db-instance-class db.t3.micro `
        --engine postgres `
        --engine-version 15.4 `
        --master-username postgres `
        --master-user-password $DBPassword `
        --allocated-storage 20 `
        --vpc-security-group-ids $rdsSgId `
        --publicly-accessible `
        --backup-retention-period 0 `
        --region $Region `
        --no-multi-az `
        --storage-type gp2 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ RDS database creation initiated!" -ForegroundColor Green
        Write-Host "⏳ Database is being created (this takes 5-10 minutes)..." -ForegroundColor Yellow

        $dbEndpoint = "CREATING"
    } else {
        Write-Host "⚠️  RDS creation may have failed or already exists" -ForegroundColor Yellow
        $dbEndpoint = "CHECK_AWS_CONSOLE"
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Infrastructure Deployment Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green

# Save deployment info
$deploymentInfo = @{
    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Region = $Region
    VpcId = $vpcId
    EC2SecurityGroup = $ec2SgId
    RDSSecurityGroup = $rdsSgId
    InstanceId = $instanceId
    PublicIP = $publicIp
    DBIdentifier = $dbIdentifier
    DBEndpoint = $dbEndpoint
    DBPassword = $DBPassword
    KeyPairName = $KeyPairName
    KeyPath = $keyPath
}

$deploymentInfoPath = Join-Path $PSScriptRoot "deployment-info.json"
$deploymentInfo | ConvertTo-Json | Out-File -FilePath $deploymentInfoPath

Write-Host "📄 Deployment info saved to: $deploymentInfoPath" -ForegroundColor Cyan

Write-Host "`n✅ INFRASTRUCTURE READY!" -ForegroundColor Green
Write-Host "`nEC2 Public IP: $publicIp" -ForegroundColor Cyan
Write-Host "SSH Key: $keyPath" -ForegroundColor Cyan
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Wait for RDS to be available (5-10 minutes if new)" -ForegroundColor White
Write-Host "   Check: aws rds describe-db-instances --db-instance-identifier $dbIdentifier --query 'DBInstances[0].DBInstanceStatus'" -ForegroundColor Gray
Write-Host "`n2. Deploy microservices to EC2" -ForegroundColor White
Write-Host "   I'll help you with this next!" -ForegroundColor Cyan
Write-Host ""
