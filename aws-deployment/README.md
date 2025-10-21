# AWS Free Tier Deployment Guide

## Quick Start - Deploy in 1 Hour

This guide will help you deploy both monolith and microservices architectures to AWS Free Tier.

### Prerequisites

1. AWS Account (new account gets 12 months free tier)
2. AWS CLI installed and configured
3. Docker installed locally
4. Git installed

### Free Tier Resources Used

- **1x EC2 t2.micro** (750 hrs/month) - Monolith
- **1x EC2 t2.micro** (750 hrs/month) - Microservices
- **2x RDS db.t2.micro** (750 hrs each = 1500 hrs total)
- **S3** (5GB free) - Frontend hosting
- **CloudFront** (1TB free) - CDN
- **DynamoDB** (25GB free) - Leaderboard cache

**Total Monthly Cost: $0** (if within free tier limits)

---

## Architecture Overview

### Monolith Architecture
```
CloudFront → S3 (React) → EC2 (ASP.NET Monolith) → RDS PostgreSQL
```

### Microservices Architecture
```
CloudFront → S3 (React) → EC2 (Nginx + 4 Docker containers) → RDS PostgreSQL + DynamoDB
```

---

## Deployment Steps

### Phase 1: AWS Account Setup (15 minutes)

1. **Create AWS Account** (if you don't have one)
   - Sign up at https://aws.amazon.com
   - You'll need a credit card (won't be charged if staying in free tier)
   - Verify email and phone

2. **Install AWS CLI**
   ```bash
   # Windows
   winget install Amazon.AWSCLI

   # Verify installation
   aws --version
   ```

3. **Configure AWS Credentials**
   ```bash
   aws configure
   # Enter:
   # - AWS Access Key ID
   # - AWS Secret Access Key
   # - Default region: us-east-1 (best free tier availability)
   # - Default output format: json
   ```

4. **Create SSH Key Pair**
   ```bash
   aws ec2 create-key-pair --key-name kvizhub-key --query 'KeyMaterial' --output text > kvizhub-key.pem
   chmod 400 kvizhub-key.pem  # Linux/Mac
   # Windows: Right-click -> Properties -> Security -> Advanced
   ```

---

### Phase 2: Deploy Monolith (30 minutes)

1. **Run Monolith Deployment Script**
   ```bash
   cd aws-deployment/monolith
   ./deploy-monolith.sh
   ```

   This script will:
   - Create VPC, subnets, security groups
   - Launch EC2 t2.micro instance
   - Create RDS PostgreSQL db.t2.micro
   - Deploy Docker container with monolith
   - Configure CloudFront + S3 for frontend

2. **Verify Deployment**
   ```bash
   # Get EC2 public IP
   aws ec2 describe-instances --filters "Name=tag:Name,Values=kvizhub-monolith" --query 'Reservations[0].Instances[0].PublicIpAddress'

   # Test API
   curl http://<EC2-IP>/api/health
   ```

---

### Phase 3: Deploy Microservices (45 minutes)

1. **Run Microservices Deployment Script**
   ```bash
   cd aws-deployment/microservices
   ./deploy-microservices.sh
   ```

   This script will:
   - Create separate VPC for microservices
   - Launch EC2 t2.micro with Docker Compose
   - Create RDS with multiple databases
   - Create DynamoDB table for leaderboard
   - Create SQS queue for async processing
   - Configure Nginx as API gateway

2. **Verify Microservices**
   ```bash
   # Test each service
   EC2_IP=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=kvizhub-microservices" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

   curl http://$EC2_IP/api/auth/health
   curl http://$EC2_IP/api/quiz/health
   curl http://$EC2_IP/api/execution/health
   curl http://$EC2_IP/api/leaderboard/health
   ```

---

### Phase 4: Deploy Frontend (15 minutes)

1. **Build and Deploy React App**
   ```bash
   cd ../frontend
   npm run build

   # Deploy to S3
   aws s3 cp dist/ s3://kvizhub-frontend-monolith/ --recursive
   aws s3 cp dist/ s3://kvizhub-frontend-microservices/ --recursive

   # Create CloudFront distribution
   ./create-cloudfront.sh
   ```

2. **Get Frontend URLs**
   ```bash
   echo "Monolith Frontend: https://d123abc.cloudfront.net"
   echo "Microservices Frontend: https://d456def.cloudfront.net"
   ```

---

## Performance Testing

### Run Load Tests

```bash
cd ../testing
./run-comparison-tests.sh
```

This will:
- Run K6 load tests against both architectures
- Test scenarios: Login, Browse Quizzes, Take Quiz, Submit, Leaderboard
- Generate comparison report

### View Results

```bash
cat results/comparison-report.md
```

---

## Cost Monitoring

### Check Your AWS Bill

```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost
```

### Set Up Billing Alerts

1. Go to AWS Console → Billing → Budgets
2. Create budget: $5/month
3. Set alert at 80% ($4)

---

## Cleanup (Important!)

When you're done with testing:

```bash
# Destroy monolith infrastructure
cd aws-deployment/monolith
./destroy.sh

# Destroy microservices infrastructure
cd ../microservices
./destroy.sh
```

This will delete all resources and stop charges.

---

## Troubleshooting

### EC2 Instance Not Starting
- Check free tier limits: `aws ec2 describe-instances`
- Verify you're in us-east-1 region
- Check security group allows port 80

### RDS Connection Failed
- Security group must allow port 5432 from EC2 security group
- Check connection string in environment variables
- Wait 5-10 minutes after RDS creation (initialization time)

### Frontend Not Loading
- S3 bucket must be public for CloudFront
- CloudFront distribution takes 15-20 minutes to deploy
- Check CORS settings in S3 bucket

### Out of Free Tier
- Stop/terminate unused EC2 instances
- Delete old RDS snapshots
- Empty S3 buckets
- Delete CloudWatch logs older than 7 days

---

## Next Steps

1. **Deploy both architectures** following steps above
2. **Run load tests** to compare performance
3. **Document findings** for your thesis
4. **Clean up resources** when done

For detailed instructions on each step, see the specific files in this directory.
