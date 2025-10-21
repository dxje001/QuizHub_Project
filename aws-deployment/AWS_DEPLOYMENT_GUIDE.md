# AWS Deployment Guide - Step by Step

## Overview

This guide will help you deploy both monolith and microservices architectures to AWS Free Tier in about **2-3 hours**.

---

## Phase 1: Deploy Infrastructure (15 minutes) ✅ DO THIS NOW

### Step 1: Run Infrastructure Deployment

```powershell
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
.\aws-deployment\deploy-to-aws.ps1
```

**This will create:**
- ✅ SSH key pair (kvizhub-key.pem)
- ✅ Security groups for EC2 and RDS
- ✅ 2× EC2 t2.micro instances
- ✅ 1× RDS PostgreSQL database (db.t3.micro)

**Expected output:**
```
✅ Authenticated as: arn:aws:iam::...
✅ Key pair created
✅ Security groups created
✅ EC2 instances launched
✅ RDS database creation initiated

Monolith IP:       54.123.456.789
Microservices IP:  54.987.654.321
```

### Step 2: Wait for RDS (5-10 minutes)

The RDS database takes 5-10 minutes to be ready. Check status:

```powershell
aws rds describe-db-instances --db-instance-identifier kvizhub-db --query 'DBInstances[0].DBInstanceStatus'
```

When it shows `"available"`, proceed to Phase 2.

---

## Phase 2: Deploy Applications (30-45 minutes)

### Step 1: Prepare Deployment Package

```powershell
.\aws-deployment\deploy-applications.ps1
```

This creates:
- ✅ Deployment package with all code
- ✅ Setup scripts for both EC2 instances
- ✅ Environment configuration files

### Step 2: Install SSH Client (if needed)

**Windows 10/11:** OpenSSH is usually pre-installed. Test:

```powershell
ssh -V
```

If not installed:
```powershell
# Install OpenSSH (run as Administrator)
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

### Step 3: Deploy to Monolith EC2

The script will give you exact commands, but here's the process:

#### 3.1 Upload code to EC2

**Option A: Use SCP (recommended)**
```powershell
scp -i "aws-deployment\kvizhub-key.pem" -r "aws-deployment\deployment-package\*" ubuntu@<MONOLITH-IP>:/home/ubuntu/kvizhub/
```

**Option B: Use Git (alternative)**
```powershell
# SSH into EC2 first
ssh -i "aws-deployment\kvizhub-key.pem" ubuntu@<MONOLITH-IP>

# Then clone your repo
git clone <your-github-repo-url>
```

#### 3.2 SSH into Monolith EC2

```powershell
ssh -i "aws-deployment\kvizhub-key.pem" ubuntu@<MONOLITH-IP>
```

#### 3.3 Run Setup Script

Once connected to EC2:

```bash
cd /home/ubuntu/kvizhub
chmod +x setup-monolith.sh
./setup-monolith.sh
```

This installs Docker and sets up the environment.

#### 3.4 Update Connection String

Edit the .env file with RDS endpoint:

```bash
nano .env
```

Update this line:
```
# Change this:
ConnectionStrings__DefaultConnection=Host=postgres;Database=kvizhub;...

# To this (use actual RDS endpoint):
ConnectionStrings__DefaultConnection=Host=<RDS-ENDPOINT>;Database=kvizhub;Username=postgres;Password=<PASSWORD>
```

Get RDS endpoint:
```powershell
aws rds describe-db-instances --db-instance-identifier kvizhub-db --query 'DBInstances[0].Endpoint.Address'
```

#### 3.5 Start Monolith

```bash
docker-compose up -d
```

Wait 2-3 minutes for containers to start, then verify:

```bash
docker ps  # Should show 3 containers running
curl http://localhost:5000/health  # Should return OK
```

#### 3.6 Test Monolith

From your local browser:
```
http://<MONOLITH-IP>:5000/swagger
```

You should see the Swagger API documentation!

### Step 4: Deploy to Microservices EC2

Same process as monolith:

```powershell
# Upload code
scp -i "aws-deployment\kvizhub-key.pem" -r "aws-deployment\deployment-package\*" ubuntu@<MICROSERVICES-IP>:/home/ubuntu/kvizhub/

# SSH in
ssh -i "aws-deployment\kvizhub-key.pem" ubuntu@<MICROSERVICES-IP>

# On EC2:
cd /home/ubuntu/kvizhub
chmod +x setup-microservices.sh
./setup-microservices.sh

# Update .env with RDS endpoint
nano .env

# Start microservices
docker-compose -f docker-compose.microservices-simulation.yml up -d

# Verify
docker ps  # Should show 6 containers (4 services + nginx + postgres)
curl http://localhost:8080/health  # Should return "Microservices Gateway OK"
```

#### Test Microservices

From your local browser:
```
http://<MICROSERVICES-IP>:8080/health
```

Should show: "Microservices Gateway OK"

---

## Phase 3: Deploy Frontend (Optional - 15 minutes)

You can skip this and just test with Swagger/curl, or deploy React frontend to S3:

### Create S3 Buckets

```powershell
aws s3 mb s3://kvizhub-frontend-monolith-<your-name>
aws s3 mb s3://kvizhub-frontend-microservices-<your-name>
```

(Replace `<your-name>` with something unique)

### Build and Upload Frontend

```powershell
cd frontend
npm install
npm run build

# Upload to S3
aws s3 cp dist/ s3://kvizhub-frontend-monolith-<your-name>/ --recursive
aws s3 cp dist/ s3://kvizhub-frontend-microservices-<your-name>/ --recursive

# Enable static website hosting
aws s3 website s3://kvizhub-frontend-monolith-<your-name>/ --index-document index.html
aws s3 website s3://kvizhub-frontend-microservices-<your-name>/ --index-document index.html

# Make public
aws s3 cp s3://kvizhub-frontend-monolith-<your-name>/ s3://kvizhub-frontend-monolith-<your-name>/ --recursive --acl public-read
```

**Frontend URLs:**
```
http://kvizhub-frontend-monolith-<your-name>.s3-website-us-east-1.amazonaws.com
http://kvizhub-frontend-microservices-<your-name>.s3-website-us-east-1.amazonaws.com
```

---

## Phase 4: Performance Testing (30 minutes)

Once both architectures are deployed and working:

### Install K6

```powershell
choco install k6
```

### Run Load Tests

```powershell
cd aws-deployment\testing

# Test monolith
$env:API_URL = "http://<MONOLITH-IP>:5000"
k6 run --out json=results\monolith-aws.json load-test.js

# Test microservices
$env:API_URL = "http://<MICROSERVICES-IP>:8080"
k6 run --out json=results\microservices-aws.json load-test.js

# Generate comparison report
.\run-tests.ps1 -MonolithUrl "http://<MONOLITH-IP>:5000" -MicroservicesUrl "http://<MICROSERVICES-IP>:8080"
```

### Review Results

```powershell
cat results\comparison-report-*.md
```

---

## Troubleshooting

### EC2 Connection Refused

**Problem:** Can't connect to EC2 instance

**Solution:**
```powershell
# Check instance is running
aws ec2 describe-instances --instance-ids <INSTANCE-ID> --query 'Reservations[0].Instances[0].State.Name'

# Check security group allows your IP
# Add your IP to security group if needed
```

### Docker Not Starting

**Problem:** Docker containers won't start

**Solution:**
```bash
# Check Docker logs
docker-compose logs

# Check if PostgreSQL is running
docker ps | grep postgres

# Restart Docker
sudo systemctl restart docker
```

### Database Connection Failed

**Problem:** Can't connect to RDS

**Solution:**
```bash
# Test RDS connection from EC2
psql -h <RDS-ENDPOINT> -U postgres -d kvizhub

# Check security group allows traffic from EC2
aws ec2 describe-security-groups --group-ids <RDS-SG-ID>
```

### Out of Disk Space

**Problem:** EC2 runs out of disk

**Solution:**
```bash
# Clean up Docker
docker system prune -a

# Check disk usage
df -h
```

---

## Cleanup (IMPORTANT!)

When you're done, delete all resources to avoid charges:

### Delete Everything

```powershell
# Terminate EC2 instances
aws ec2 terminate-instances --instance-ids <MONOLITH-ID> <MICROSERVICES-ID>

# Delete RDS database
aws rds delete-db-instance --db-instance-identifier kvizhub-db --skip-final-snapshot

# Delete security groups (wait until EC2/RDS are deleted first)
aws ec2 delete-security-group --group-id <EC2-SG-ID>
aws ec2 delete-security-group --group-id <RDS-SG-ID>

# Delete S3 buckets
aws s3 rm s3://kvizhub-frontend-monolith-<your-name> --recursive
aws s3 rb s3://kvizhub-frontend-monolith-<your-name>
```

---

## Quick Reference

### Useful Commands

```powershell
# Check AWS costs
aws ce get-cost-and-usage --time-period Start=2025-01-01,End=2025-01-31 --granularity MONTHLY --metrics BlendedCost

# List all EC2 instances
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,Tags[?Key==`Name`].Value|[0]]' --output table

# Check RDS status
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]' --output table

# Connect to EC2
.\aws-deployment\connect-ssh.ps1 -Target monolith
.\aws-deployment\connect-ssh.ps1 -Target microservices
```

### File Locations

- **Deployment Info:** `aws-deployment\deployment-info.json`
- **SSH Key:** `aws-deployment\kvizhub-key.pem`
- **Test Results:** `aws-deployment\testing\results\`
- **Logs:** On EC2 at `/home/ubuntu/kvizhub/`

---

## Expected Timeline

| Phase | Time | Status |
|-------|------|--------|
| AWS Account Setup | 15 min | ✅ Done |
| AWS CLI Configuration | 5 min | ✅ Done |
| Infrastructure Deployment | 15 min | ⏳ Current |
| RDS Wait Time | 10 min | ⏰ Waiting |
| Deploy Monolith | 20 min | ⏳ Next |
| Deploy Microservices | 20 min | ⏳ Next |
| Deploy Frontend (Optional) | 15 min | ⏳ Optional |
| Performance Testing | 30 min | ⏳ Last |
| **TOTAL** | **2-3 hours** | |

---

## Success Criteria

You'll know everything works when:

✅ Monolith Swagger UI loads: `http://<MONOLITH-IP>:5000/swagger`
✅ Microservices health check works: `http://<MICROSERVICES-IP>:8080/health`
✅ Can register/login through API
✅ K6 load tests complete without errors
✅ Comparison report shows performance data

---

## Next Steps

1. ✅ Run `deploy-to-aws.ps1` (DO THIS NOW!)
2. ⏰ Wait for RDS to be ready
3. ✅ Run `deploy-applications.ps1`
4. ✅ SSH into EC2 and start applications
5. ✅ Run performance tests
6. ✅ Document findings for thesis

---

**Ready? Run the first command:**

```powershell
.\aws-deployment\deploy-to-aws.ps1
```

Good luck! 🚀
