# FAST TRACK DEPLOYMENT - Get Done in 3 Days

This is the **fastest path** to complete your project. We'll simplify everything to get results quickly.

## Simplified Strategy

Instead of complex AWS infrastructure, we'll use the **simplest possible approach** that still demonstrates the comparison:

### Day 1: Keep Monolith, Extract 2 Microservices (8 hours)
### Day 2: Deploy to AWS Free Tier (6 hours)
### Day 3: Load Test & Document Results (6 hours)

**Total: 20 hours = Done in 3 days**

---

## SIMPLIFIED ARCHITECTURE

### What We're Building:

**Monolith (Existing):**
- Keep your current application AS-IS
- Deploy to single EC2 instance
- Use existing PostgreSQL database

**Microservices (Simplified to 2 services):**
- **Service 1: Auth + User** (separate from monolith)
- **Service 2: Quiz + Execution + Leaderboard** (everything else)
- Deploy both on SAME EC2 instance with Nginx routing
- Share same RDS database (different schemas)

**Why only 2 services?**
- ✅ Still demonstrates microservices architecture
- ✅ Shows service boundaries and communication
- ✅ Much faster to implement
- ✅ Easier to test and compare
- ✅ Good enough for university project

---

## DAY 1: CODE CHANGES (8 hours)

### Step 1.1: Create Auth Microservice (3 hours)

Extract authentication logic into separate project:

```bash
cd backend/src
mkdir KvizHub.AuthService
cd KvizHub.AuthService
dotnet new webapi
```

**What to move:**
- AuthController.cs
- User-related DTOs
- Authentication services
- JWT token logic
- User management

**Keep it simple:**
- Share the SAME database with monolith (for now)
- Just separate the API endpoints
- Use same connection string

### Step 1.2: Update Monolith to Call Auth Service (2 hours)

In your monolith:
- Remove AuthController
- Add HttpClient to call Auth Service for user validation
- Keep everything else the same

### Step 1.3: Create Docker Compose (2 hours)

```yaml
services:
  # Original monolith (quiz functionality)
  monolith:
    build: ./backend
    ports:
      - "5000:80"

  # New auth microservice
  auth-service:
    build: ./backend/src/KvizHub.AuthService
    ports:
      - "5001:80"

  # Nginx to route requests
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### Step 1.4: Test Locally (1 hour)

```bash
docker-compose up
# Test that it works
curl http://localhost/api/auth/login
curl http://localhost/api/quiz
```

---

## DAY 2: AWS DEPLOYMENT (6 hours)

### Step 2.1: Setup AWS Account (30 minutes)

1. Create AWS account
2. Install AWS CLI
3. Configure credentials
4. Create EC2 key pair

```bash
aws configure
aws ec2 create-key-pair --key-name kvizhub-key --query 'KeyMaterial' --output text > kvizhub-key.pem
```

### Step 2.2: Launch EC2 Instances (1 hour)

**Launch 2x t2.micro instances:**

```bash
# Instance 1: Monolith
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name kvizhub-key \
  --security-group-ids sg-xxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kvizhub-monolith}]'

# Instance 2: Microservices
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.micro \
  --key-name kvizhub-key \
  --security-group-ids sg-xxx \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=kvizhub-microservices}]'
```

**Or use AWS Console:**
1. EC2 → Launch Instance
2. Select Ubuntu 22.04 LTS (Free tier eligible)
3. Instance type: t2.micro
4. Create new security group: Allow ports 22, 80, 443
5. Launch (do this twice)

### Step 2.3: Setup RDS PostgreSQL (1 hour)

```bash
aws rds create-db-instance \
  --db-instance-identifier kvizhub-db \
  --db-instance-class db.t2.micro \
  --engine postgres \
  --master-username postgres \
  --master-user-password YourSecurePassword123! \
  --allocated-storage 20 \
  --publicly-accessible
```

**Or use AWS Console:**
1. RDS → Create database
2. PostgreSQL
3. Free tier template
4. db.t2.micro
5. 20GB storage
6. Public access: Yes
7. Create

**Wait 10 minutes** for RDS to be available.

### Step 2.4: Deploy Monolith to EC2 #1 (1.5 hours)

SSH into first EC2 instance:

```bash
# Get public IP
EC2_IP=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=kvizhub-monolith" --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

# SSH
ssh -i kvizhub-key.pem ubuntu@$EC2_IP

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu
exit

# SSH again (to apply group)
ssh -i kvizhub-key.pem ubuntu@$EC2_IP

# Clone your repo
git clone <your-repo-url>
cd W2

# Set environment variables
export DATABASE_URL="Host=<RDS-ENDPOINT>;Database=kvizhub;Username=postgres;Password=YourSecurePassword123!"

# Run monolith
docker-compose -f docker-compose.yml up -d
```

### Step 2.5: Deploy Microservices to EC2 #2 (1.5 hours)

Same process on second EC2:

```bash
ssh -i kvizhub-key.pem ubuntu@<EC2-2-IP>

# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo usermod -aG docker ubuntu
exit

ssh -i kvizhub-key.pem ubuntu@<EC2-2-IP>

# Clone repo
git clone <your-repo-url>
cd W2/aws-deployment/microservices

# Deploy microservices
docker-compose -f docker-compose.microservices.yml up -d
```

### Step 2.6: Deploy Frontend to S3 (30 minutes)

```bash
# Build React app
cd frontend
npm install
npm run build

# Create S3 bucket
aws s3 mb s3://kvizhub-frontend-monolith
aws s3 mb s3://kvizhub-frontend-microservices

# Upload
aws s3 cp dist/ s3://kvizhub-frontend-monolith/ --recursive --acl public-read
aws s3 cp dist/ s3://kvizhub-frontend-microservices/ --recursive --acl public-read

# Enable static website hosting
aws s3 website s3://kvizhub-frontend-monolith/ --index-document index.html
aws s3 website s3://kvizhub-frontend-microservices/ --index-document index.html
```

**Frontend URLs:**
- Monolith: `http://kvizhub-frontend-monolith.s3-website-us-east-1.amazonaws.com`
- Microservices: `http://kvizhub-frontend-microservices.s3-website-us-east-1.amazonaws.com`

---

## DAY 3: TESTING & DOCUMENTATION (6 hours)

### Step 3.1: Install K6 Load Testing Tool (15 minutes)

```bash
# Windows
choco install k6

# Or download from https://k6.io/
```

### Step 3.2: Create Simple Load Test (1 hour)

Create `load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp to 50 users
    { duration: '5m', target: 50 },   // Stay at 50
    { duration: '2m', target: 100 },  // Ramp to 100
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 0 },    // Ramp down
  ],
};

export default function () {
  // Test login
  let loginRes = http.post(`${__ENV.API_URL}/api/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login time < 500ms': (r) => r.timings.duration < 500,
  });

  if (loginRes.status === 200) {
    let token = loginRes.json('token');

    // Test get quizzes
    let quizRes = http.get(`${__ENV.API_URL}/api/quiz`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    check(quizRes, {
      'quiz status 200': (r) => r.status === 200,
      'quiz time < 300ms': (r) => r.timings.duration < 300,
    });
  }

  sleep(1);
}
```

### Step 3.3: Run Load Tests (2 hours)

```bash
# Test monolith
API_URL=http://<EC2-1-IP> k6 run --out json=monolith-results.json load-test.js

# Test microservices
API_URL=http://<EC2-2-IP> k6 run --out json=microservices-results.json load-test.js
```

### Step 3.4: Analyze Results (1 hour)

K6 will output:

```
     ✓ login status 200
     ✓ login time < 500ms
     ✓ quiz status 200
     ✓ quiz time < 300ms

     checks.........................: 100.00% ✓ 12000 ✗ 0
     data_received..................: 24 MB   80 kB/s
     data_sent......................: 2.4 MB  8.0 kB/s
     http_req_blocked...............: avg=1.2ms   min=0s    med=0s      max=500ms
     http_req_connecting............: avg=800µs   min=0s    med=0s      max=200ms
     http_req_duration..............: avg=250ms   min=50ms  med=200ms   max=2s
     http_req_failed................: 0.00%   ✓ 0    ✗ 6000
     http_req_receiving.............: avg=1ms     min=0s    med=0s      max=50ms
     http_req_sending...............: avg=500µs   min=0s    med=0s      max=10ms
     http_req_tls_handshaking.......: avg=0s      min=0s    med=0s      max=0s
     http_req_waiting...............: avg=248ms   min=49ms  med=199ms   max=1.99s
     http_reqs......................: 6000    20/s
     iteration_duration.............: avg=2.5s    min=1.5s  med=2.4s    max=5s
     iterations.....................: 3000    10/s
     vus............................: 100     min=0  max=100
     vus_max........................: 100     min=100 max=100
```

**Compare:**
- Average response time
- P95 response time
- Requests per second
- Error rate

### Step 3.5: Document Results (1.5 hours)

Create a simple comparison table:

| Metric | Monolith | Microservices | Winner |
|--------|----------|---------------|---------|
| Avg Response Time | 250ms | 280ms | Monolith |
| P95 Response Time | 500ms | 550ms | Monolith |
| Requests/sec | 20/s | 18/s | Monolith |
| Error Rate | 0% | 0% | Tie |
| Max Concurrent Users | 100 | 100 | Tie |
| Deployment Complexity | Low | High | Monolith |
| Fault Isolation | No | Yes | Microservices |
| Scalability | Limited | Better | Microservices |

### Step 3.6: Write Conclusion (30 minutes)

**Sample conclusion:**

> For QuizHub's current scale (100 concurrent users), the **monolith performed better** with 12% lower latency due to no network overhead between services. However, **microservices demonstrated better fault isolation** - when the Auth service was stopped, the Quiz service continued to serve cached data.
>
> **Recommendation:** For small-scale applications (<1000 concurrent users), monolith is more efficient. Microservices are beneficial when:
> - Different components need independent scaling
> - Team size is large (> 5 developers)
> - Fault isolation is critical
> - Technology flexibility is needed

---

## DONE!

You now have:
- ✅ Working monolith on AWS
- ✅ Working microservices on AWS
- ✅ Performance comparison data
- ✅ Documentation for your thesis

## Cleanup When Done

```bash
# Terminate EC2 instances
aws ec2 terminate-instances --instance-ids <instance-id-1> <instance-id-2>

# Delete RDS
aws rds delete-db-instance --db-instance-identifier kvizhub-db --skip-final-snapshot

# Empty and delete S3 buckets
aws s3 rm s3://kvizhub-frontend-monolith --recursive
aws s3 rb s3://kvizhub-frontend-monolith
aws s3 rm s3://kvizhub-frontend-microservices --recursive
aws s3 rb s3://kvizhub-frontend-microservices
```

---

## Even FASTER Alternative: Skip AWS, Use Local Docker

If you're really pressed for time, you can run the entire comparison **locally on your computer**:

1. Deploy monolith in Docker container
2. Deploy microservices in Docker Compose
3. Run K6 load tests against localhost
4. Compare results

**Advantage:** No AWS setup, can be done in 2 days instead of 3

**Disadvantage:** Not "cloud native", but still demonstrates microservices concepts

---

## Need Help?

If you get stuck:
1. Check EC2 security groups (must allow ports 22, 80, 443)
2. Check RDS security groups (must allow port 5432 from EC2)
3. Check Docker logs: `docker logs <container-name>`
4. Check Nginx logs: `docker exec nginx cat /var/log/nginx/error.log`

**Let me know if you want to proceed with this fast track approach!**
