# Manual AWS Deployment Steps

If the PowerShell script doesn't work, run these commands manually in PowerShell:

## Step 1: Create Key Pair

```powershell
aws ec2 create-key-pair --key-name kvizhub-key --region us-east-1 --query 'KeyMaterial' --output text > aws-deployment\kvizhub-key.pem
```

## Step 2: Get Default VPC ID

```powershell
$vpcId = aws ec2 describe-vpcs --region us-east-1 --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text
Write-Host "VPC ID: $vpcId"
```

## Step 3: Create Security Group for EC2

```powershell
$ec2SgId = aws ec2 create-security-group --group-name kvizhub-microservices-sg --description "Security group for QuizHub Microservices" --vpc-id $vpcId --region us-east-1 --query 'GroupId' --output text

Write-Host "EC2 Security Group: $ec2SgId"

# Add rules
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 5000-5010 --cidr 0.0.0.0/0 --region us-east-1
```

## Step 4: Create Security Group for RDS

```powershell
$rdsSgId = aws ec2 create-security-group --group-name kvizhub-rds-sg --description "Security group for RDS" --vpc-id $vpcId --region us-east-1 --query 'GroupId' --output text

Write-Host "RDS Security Group: $rdsSgId"

# Add rules
aws ec2 authorize-security-group-ingress --group-id $rdsSgId --protocol tcp --port 5432 --source-group $ec2SgId --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $rdsSgId --protocol tcp --port 5432 --cidr 0.0.0.0/0 --region us-east-1
```

## Step 5: Get Latest Ubuntu AMI

```powershell
$amiId = aws ec2 describe-images --region us-east-1 --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text

Write-Host "AMI ID: $amiId"
```

## Step 6: Launch EC2 Instance

```powershell
$instanceId = aws ec2 run-instances --image-id $amiId --instance-type t2.micro --key-name kvizhub-key --security-group-ids $ec2SgId --region us-east-1 --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kvizhub-microservices}]' --query 'Instances[0].InstanceId' --output text

Write-Host "Instance ID: $instanceId"

# Wait for instance to be running
Write-Host "Waiting for instance to start..."
aws ec2 wait instance-running --instance-ids $instanceId --region us-east-1

# Get public IP
$publicIp = aws ec2 describe-instances --instance-ids $instanceId --region us-east-1 --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

Write-Host "Public IP: $publicIp"
```

## Step 7: Create RDS Database

```powershell
aws rds create-db-instance --db-instance-identifier kvizhub-db --db-instance-class db.t3.micro --engine postgres --engine-version 15.4 --master-username postgres --master-user-password "KvizHub2024SecurePassword!" --allocated-storage 20 --vpc-security-group-ids $rdsSgId --publicly-accessible --backup-retention-period 0 --region us-east-1 --no-multi-az --storage-type gp2

Write-Host "RDS database creation started (takes 5-10 minutes)"
```

## Step 8: Save Deployment Info

```powershell
# Create JSON with deployment info
$deployInfo = @{
    InstanceId = $instanceId
    PublicIP = $publicIp
    DBPassword = "KvizHub2024SecurePassword!"
    KeyPath = "aws-deployment\kvizhub-key.pem"
} | ConvertTo-Json

$deployInfo | Out-File -FilePath "aws-deployment\deployment-info.json"

Write-Host "`n✅ DONE! Your EC2 Public IP is: $publicIp"
```

---

## Quick Copy-Paste Version

Here are ALL commands in one block (copy and paste into PowerShell):

```powershell
# Create key pair
aws ec2 create-key-pair --key-name kvizhub-key --region us-east-1 --query 'KeyMaterial' --output text > aws-deployment\kvizhub-key.pem

# Get VPC
$vpcId = aws ec2 describe-vpcs --region us-east-1 --filters "Name=isDefault,Values=true" --query 'Vpcs[0].VpcId' --output text

# Create EC2 security group
$ec2SgId = aws ec2 create-security-group --group-name kvizhub-microservices-sg --description "QuizHub Microservices SG" --vpc-id $vpcId --region us-east-1 --query 'GroupId' --output text
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 22 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 80 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 8080 --cidr 0.0.0.0/0 --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $ec2SgId --protocol tcp --port 5000-5010 --cidr 0.0.0.0/0 --region us-east-1

# Create RDS security group
$rdsSgId = aws ec2 create-security-group --group-name kvizhub-rds-sg --description "QuizHub RDS SG" --vpc-id $vpcId --region us-east-1 --query 'GroupId' --output text
aws ec2 authorize-security-group-ingress --group-id $rdsSgId --protocol tcp --port 5432 --source-group $ec2SgId --region us-east-1
aws ec2 authorize-security-group-ingress --group-id $rdsSgId --protocol tcp --port 5432 --cidr 0.0.0.0/0 --region us-east-1

# Get AMI
$amiId = aws ec2 describe-images --region us-east-1 --owners 099720109477 --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text

# Launch EC2
$instanceId = aws ec2 run-instances --image-id $amiId --instance-type t2.micro --key-name kvizhub-key --security-group-ids $ec2SgId --region us-east-1 --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kvizhub-microservices}]' --query 'Instances[0].InstanceId' --output text

Write-Host "Waiting for EC2 to start..."
aws ec2 wait instance-running --instance-ids $instanceId --region us-east-1

$publicIp = aws ec2 describe-instances --instance-ids $instanceId --region us-east-1 --query 'Reservations[0].Instances[0].PublicIpAddress' --output text

# Create RDS
aws rds create-db-instance --db-instance-identifier kvizhub-db --db-instance-class db.t3.micro --engine postgres --engine-version 15.4 --master-username postgres --master-user-password "KvizHub2024SecurePassword!" --allocated-storage 20 --vpc-security-group-ids $rdsSgId --publicly-accessible --backup-retention-period 0 --region us-east-1 --no-multi-az --storage-type gp2

# Save info
$deployInfo = @{
    InstanceId = $instanceId
    PublicIP = $publicIp
    DBPassword = "KvizHub2024SecurePassword!"
    KeyPath = "aws-deployment\kvizhub-key.pem"
} | ConvertTo-Json
$deployInfo | Out-File -FilePath "aws-deployment\deployment-info.json"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✅ INFRASTRUCTURE DEPLOYED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nEC2 Public IP: $publicIp" -ForegroundColor Cyan
Write-Host "Instance ID: $instanceId" -ForegroundColor Cyan
Write-Host "`nRDS database is being created (5-10 minutes)..." -ForegroundColor Yellow
Write-Host "`nNext: SSH into EC2 and deploy microservices!" -ForegroundColor Green
```
