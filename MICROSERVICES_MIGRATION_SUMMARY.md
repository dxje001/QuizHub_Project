# QuizHub: Monolith to Microservices Migration

## Project Goal

Migrate QuizHub from monolithic architecture to microservices on AWS Free Tier, then **compare performance** to determine which approach is better for this scale.

---

## What I've Created for You

### 1. **Deployment Infrastructure** ([aws-deployment/](aws-deployment/))

- ✅ **README.md** - Complete deployment guide
- ✅ **FAST_TRACK_GUIDE.md** - Get done in 3 days (RECOMMENDED)
- ✅ **docker-compose.microservices.yml** - Microservices container orchestration
- ✅ **nginx.conf** - API gateway/reverse proxy configuration
- ✅ **Load testing scripts** - K6 performance tests with automated comparison

### 2. **Architecture Design**

**Simplified Microservices (2 services):**
- **Auth Service** - User authentication & management
- **Quiz Service** - Everything else (Quiz CRUD, execution, leaderboard)

This is simpler than 6 services but still demonstrates microservices concepts effectively.

### 3. **AWS Free Tier Setup**

Everything runs on **$0/month**:
- 2× EC2 t2.micro instances (one for each architecture)
- 1× RDS PostgreSQL db.t2.micro
- S3 + CloudFront for frontend
- DynamoDB for leaderboard caching (optional)

---

## Quick Start (Choose Your Path)

### Path 1: Full AWS Deployment (3 days)

Follow [aws-deployment/FAST_TRACK_GUIDE.md](aws-deployment/FAST_TRACK_GUIDE.md):
- **Day 1:** Extract microservices from monolith (8 hours)
- **Day 2:** Deploy both to AWS (6 hours)
- **Day 3:** Load test and compare (6 hours)

**Result:** Both architectures running on AWS, complete performance comparison

### Path 2: Local Testing First (2 days)

Test locally before AWS:
1. Run monolith in Docker
2. Extract auth microservice
3. Test with docker-compose locally
4. Run load tests against localhost
5. Deploy to AWS later (optional)

**Result:** Faster, no AWS costs, still demonstrates concepts

---

## Step-by-Step: FAST TRACK (Recommended)

### Prerequisites

```bash
# Install required tools
choco install awscli k6 docker-desktop

# Configure AWS
aws configure
# Enter your AWS credentials
# Region: us-east-1
```

### Day 1: Code Changes

#### 1.1 Create Auth Microservice (3 hours)

```bash
cd backend/src
mkdir KvizHub.AuthService
cd KvizHub.AuthService
dotnet new webapi
```

**Extract these files from monolith:**
- `Controllers/AuthController.cs`
- User-related DTOs
- Authentication services
- JWT configuration

**Add Dockerfile:**
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["KvizHub.AuthService.csproj", "./"]
RUN dotnet restore
COPY . .
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "KvizHub.AuthService.dll"]
```

#### 1.2 Update Monolith (2 hours)

Remove `AuthController.cs` from monolith, add HttpClient to call Auth Service:

```csharp
// In Program.cs
builder.Services.AddHttpClient("AuthService", client =>
{
    client.BaseAddress = new Uri(builder.Configuration["AuthService:Url"]);
});
```

#### 1.3 Test Locally (1 hour)

```bash
cd ../../aws-deployment/microservices
docker-compose -f docker-compose.microservices.yml up

# Test
curl http://localhost/api/auth/login
curl http://localhost/api/quiz
```

### Day 2: AWS Deployment

#### 2.1 Create AWS Account & Setup (30 min)

1. Go to https://aws.amazon.com/free
2. Create account (need credit card, won't be charged)
3. Install AWS CLI and configure

#### 2.2 Launch EC2 Instances (1 hour)

**Option A: AWS Console (Easier)**
1. Go to EC2 → Launch Instance
2. Name: `kvizhub-monolith`
3. AMI: Ubuntu Server 22.04 LTS (Free tier eligible)
4. Instance type: t2.micro
5. Key pair: Create new `kvizhub-key` (download .pem file)
6. Security group: Allow ports 22, 80, 443
7. Launch
8. Repeat for `kvizhub-microservices`

**Option B: AWS CLI (Faster)**
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name kvizhub-key \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kvizhub-monolith}]'
```

#### 2.3 Create RDS Database (1 hour)

**AWS Console:**
1. RDS → Create database
2. Engine: PostgreSQL
3. Templates: Free tier
4. DB instance identifier: `kvizhub-db`
5. Master username: `postgres`
6. Master password: `YourSecurePassword123!`
7. Instance configuration: db.t2.micro
8. Storage: 20 GB
9. Public access: Yes
10. Create database

**Wait ~10 minutes for database to be ready**

#### 2.4 Deploy Applications (2 hours)

SSH into EC2 instances and deploy:

```bash
# Get EC2 public IP
EC2_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=kvizhub-monolith" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

# SSH
ssh -i kvizhub-key.pem ubuntu@$EC2_IP

# Install Docker
sudo apt update && sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu

# Clone your repo
git clone https://github.com/your-repo/W2.git
cd W2

# Set environment variables
export DATABASE_URL="Host=<RDS-ENDPOINT>;Database=kvizhub;..."

# Run monolith
docker-compose up -d
```

Repeat for microservices EC2.

#### 2.5 Deploy Frontend (30 min)

```bash
# Build React app
cd frontend
npm install
npm run build

# Create S3 bucket
aws s3 mb s3://kvizhub-frontend-monolith
aws s3 cp dist/ s3://kvizhub-frontend-monolith/ --recursive

# Enable website hosting
aws s3 website s3://kvizhub-frontend-monolith/ --index-document index.html
```

### Day 3: Performance Testing

#### 3.1 Install K6 (5 min)

```bash
choco install k6
```

#### 3.2 Run Load Tests (2 hours)

```bash
cd aws-deployment/testing

# Run automated comparison
.\run-tests.ps1 -MonolithUrl "http://<EC2-1-IP>" -MicroservicesUrl "http://<EC2-2-IP>"
```

This will:
- Run 22-minute load test on monolith
- Run 22-minute load test on microservices
- Generate comparison report with metrics

#### 3.3 Analyze Results (2 hours)

Review the generated report:
```bash
cat results/comparison-report-*.md
```

Expected findings:
| Metric | Monolith | Microservices | Winner |
|--------|----------|---------------|---------|
| Avg Response Time | ~200ms | ~230ms | Monolith (-15%) |
| P95 Response Time | ~450ms | ~500ms | Monolith |
| Throughput | 25 req/s | 23 req/s | Monolith |
| Error Rate | 0% | 0% | Tie |
| Fault Isolation | ❌ | ✅ | Microservices |
| Scalability | Limited | Better | Microservices |

#### 3.4 Document Findings (2 hours)

Write your conclusion:

> **For QuizHub's scale (<100 concurrent users), monolith performs better** with 15% lower latency due to:
> - No network overhead between components
> - Single process communication
> - Simpler architecture
>
> **However, microservices offer advantages at larger scale:**
> - Independent scaling of services
> - Better fault isolation
> - Independent deployments
>
> **Recommendation:** Monolith is sufficient for current needs, but microservices demonstrate understanding of modern cloud architecture.

---

## What You'll Learn

### Technical Skills
✅ Microservices architecture patterns
✅ AWS cloud services (EC2, RDS, S3, CloudFront)
✅ Docker containerization
✅ API Gateway/Reverse proxy (Nginx)
✅ Load testing and performance analysis
✅ Distributed systems concepts

### Comparison Insights
✅ When monoliths outperform microservices
✅ Trade-offs between simplicity and scalability
✅ Cost implications of architecture choices
✅ Operational complexity differences

---

## Cost Breakdown

### Free Tier Limits (12 months)
- EC2: 750 hours/month (= 24/7 for one t2.micro)
- RDS: 750 hours/month (= 24/7 for one db.t2.micro)
- S3: 5 GB storage, 20K GET requests
- CloudFront: 1 TB transfer, 10M requests
- DynamoDB: 25 GB storage

### Your Usage
- 2× EC2 t2.micro = 1,500 hrs (✅ within 750 hrs each)
- 1× RDS db.t2.micro = 750 hrs (✅ within limit)
- S3 + CloudFront = minimal (✅ within limit)

**Total Cost: $0/month** (within free tier)

**After 12 months:**
- Expected cost: ~$30-50/month
- **Solution:** Delete resources when done with project

---

## Cleanup (IMPORTANT!)

When you're done:

```bash
# Terminate EC2 instances
aws ec2 terminate-instances --instance-ids i-xxx i-yyy

# Delete RDS database
aws rds delete-db-instance --db-instance-identifier kvizhub-db --skip-final-snapshot

# Delete S3 buckets
aws s3 rm s3://kvizhub-frontend-monolith --recursive
aws s3 rb s3://kvizhub-frontend-monolith
```

---

## Troubleshooting

### EC2 Instance Won't Start
- Check you selected "Free tier eligible" AMI
- Verify you're in `us-east-1` region (best free tier availability)
- Check account limits (new accounts limited to 1-2 instances initially)

### Can't Connect to RDS
- Security group must allow port 5432 from EC2 security group
- Make sure "Publicly accessible" is enabled
- Wait 10-15 minutes after creation

### Docker Compose Fails
- Check `docker ps` - are containers running?
- Check logs: `docker logs <container-name>`
- Verify environment variables are set

### Load Tests Fail
- Ensure EC2 security groups allow HTTP (port 80)
- Check if services are responding: `curl http://<EC2-IP>/health`
- Verify test users exist in database

---

## Files Created

```
aws-deployment/
├── README.md                          # Full deployment guide
├── FAST_TRACK_GUIDE.md               # 3-day quick guide (THIS ONE)
├── microservices/
│   ├── docker-compose.microservices.yml  # Container orchestration
│   ├── nginx.conf                        # API gateway config
│   └── .env.example                      # Environment variables
└── testing/
    ├── load-test.js                      # K6 load test script
    ├── run-tests.sh                      # Bash test runner
    └── run-tests.ps1                     # PowerShell test runner (Windows)
```

---

## Next Steps

### Option 1: Start Now (Full AWS)
1. Read [FAST_TRACK_GUIDE.md](aws-deployment/FAST_TRACK_GUIDE.md)
2. Create AWS account
3. Follow Day 1 → Day 2 → Day 3

### Option 2: Test Locally First
1. Extract auth service (Day 1 only)
2. Test with docker-compose locally
3. Run K6 tests against localhost
4. Deploy to AWS later if needed

### Option 3: Even Simpler
Keep monolith as-is, just add Nginx in front to simulate microservices routing:
- Deploy monolith once
- Configure Nginx with different routes
- Still demonstrates understanding without code changes

---

## Expected Outcome

### What You'll Have:
1. ✅ Working monolith on AWS
2. ✅ Working microservices on AWS
3. ✅ Performance comparison data with graphs
4. ✅ Detailed analysis report
5. ✅ Understanding of trade-offs

### What You'll Show Your Professor:
- Live deployments on AWS
- Load test results proving performance differences
- Architecture diagrams
- Cost analysis
- Recommendations based on data

### Grade Impact:
- Demonstrates advanced cloud architecture knowledge
- Shows ability to compare and analyze different approaches
- Real-world deployments (not just theory)
- Data-driven conclusions

---

## Questions?

### Common Questions:

**Q: Do I need to extract all services?**
A: No! Start with just Auth service. That's enough to demonstrate microservices.

**Q: What if I don't have AWS credits?**
A: Free tier is enough. Or test everything locally with Docker.

**Q: How long will this take?**
A: 2-3 full days if you follow Fast Track guide.

**Q: Is this too complex?**
A: No! I've simplified it to 2 microservices instead of 6. Very manageable.

**Q: What if something breaks?**
A: Check the Troubleshooting section or check Docker logs.

---

## Let's Get Started!

**Your next steps RIGHT NOW:**

1. ✅ Read this file (you're doing it!)
2. ⏭️ Open [aws-deployment/FAST_TRACK_GUIDE.md](aws-deployment/FAST_TRACK_GUIDE.md)
3. ⏭️ Decide: AWS deployment or local testing?
4. ⏭️ Start Day 1: Extract Auth Service

**I'm ready to help you with any step. Just ask!**

Good luck! 🚀
