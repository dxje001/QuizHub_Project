# QuizHub Performance Testing Guide

## How to Check if Microservices are Working

### Option 1: Using Your Web Browser

Open these URLs in your browser:

1. **Gateway Health Check:**
   ```
   http://54.196.182.219/health
   ```
   Should display: "Microservices Gateway OK"

2. **Quiz Service - Get All Quizzes:**
   ```
   http://54.196.182.219/api/quiz
   ```
   Should display JSON data with quizzes

3. **Quiz Service - Get Categories:**
   ```
   http://54.196.182.219/api/quiz/categories
   ```
   Should display JSON data with quiz categories

4. **Individual Services (Direct Access):**
   - Auth Service: `http://54.196.182.219:5001/`
   - Quiz Service: `http://54.196.182.219:5002/`
   - Execution Service: `http://54.196.182.219:5003/`

   *(These will show 404 or Swagger UI - both mean the service is running!)*

### Option 2: Using PowerShell

```powershell
# Navigate to performance-tests directory
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2\performance-tests"

# Check services status
.\run-tests.ps1 -CheckOnly
```

### Option 3: Using curl (from Git Bash or WSL)

```bash
# Test gateway
curl http://54.196.182.219/health

# Test quiz endpoint
curl http://54.196.182.219/api/quiz

# Test categories
curl http://54.196.182.219/api/quiz/categories
```

---

## Running Performance Tests

### Prerequisites

1. **Local Monolith Must Be Running:**
   ```bash
   cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
   docker-compose up -d
   ```

2. **Verify K6 is Installed:**
   ```powershell
   & "C:\Program Files\k6\k6.exe" version
   ```
   Should show: `k6.exe v1.3.0 ...`

### Run Tests

#### Test Both Architectures (Recommended)

```powershell
cd performance-tests
.\run-tests.ps1
```

This will:
1. Check if both services are running
2. Run ~3.5 minute load test on local monolith
3. Run ~3.5 minute load test on AWS microservices
4. Generate comparison report

**Total time: ~7 minutes**

#### Test Only Microservices

```powershell
.\run-tests.ps1 -MicroservicesOnly
```

#### Test Only Monolith

```powershell
.\run-tests.ps1 -MonolithOnly
```

### Manual Test Execution

You can also run tests manually:

```powershell
# Test monolith
& "C:\Program Files\k6\k6.exe" run .\test-monolith.js

# Test microservices
& "C:\Program Files\k6\k6.exe" run .\test-microservices.js
```

---

## Viewing Results

### During Test

K6 will show real-time progress:
- Current VUs (Virtual Users)
- Requests per second
- Response times
- Error rate

### After Test

Results are saved in:
- `monolith-results.json` - Full monolith test data
- `microservices-results.json` - Full microservices test data

### Generate Comparison Report

```powershell
.\compare-results.ps1
```

This creates `performance-comparison-report.md` with:
- Side-by-side metrics comparison
- Performance analysis
- Advantages/disadvantages of each architecture
- Recommendations for production

---

## Understanding Test Results

### Key Metrics

| Metric | Description | Good Value |
|--------|-------------|------------|
| **Avg Response Time** | Average time for all requests | < 500ms |
| **95th Percentile (p95)** | 95% of requests faster than this | < 1000ms |
| **Requests/sec** | Throughput | Higher is better |
| **Error Rate** | Failed requests | < 1% |

### What to Expect

**Monolith (Local):**
- Lower latency (20-100ms)
- Higher throughput
- Minimal network overhead

**Microservices (AWS):**
- Higher latency (100-300ms) due to:
  - Internet network latency
  - Nginx gateway overhead
  - AWS free tier instance limitations
- Lower throughput
- Better scalability and maintainability

---

## Troubleshooting

### "Monolith is NOT RESPONDING"

Start your local Docker containers:
```bash
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
docker-compose up -d
docker ps  # Verify containers are running
```

### "Microservices is NOT RESPONDING"

1. Check AWS EC2 instance is running:
   - Go to AWS Console → EC2 → Instances
   - Instance `kvizhub-instance` should be "Running"

2. Check services on EC2:
   - Connect via EC2 Instance Connect
   - Run: `docker ps`
   - All 4 containers should be "Up"

3. Check security group allows port 80:
   - EC2 Console → Security Groups
   - Inbound rules should allow HTTP (port 80)

### K6 Not Found

Reinstall K6:
```powershell
winget install k6 --silent
```

---

## Test Configuration

Both tests use identical load patterns for fair comparison:

```
0-30s:   Ramp up to 10 users
30-90s:  Maintain 10 users (60s)
90-120s: Ramp up to 20 users
120-180s: Maintain 20 users (60s)
180-210s: Ramp down to 0 users
```

**Total duration:** 210 seconds (~3.5 minutes)

---

## Quick Reference

### Your Deployment URLs

- **Monolith (Local):** http://localhost:8080
- **Microservices (AWS):** http://54.196.182.219
- **AWS RDS Database:** kvizhub-db.c8fmu8q6u6th.us-east-1.rds.amazonaws.com

### AWS Resources

- **EC2 Instance:** kvizhub-instance (t3.micro)
- **RDS Database:** kvizhub-db (db.t3.micro, PostgreSQL 15)
- **Region:** us-east-1 (N. Virginia)
- **Account ID:** 485034933797

### EC2 Services

- nginx-api-gateway (port 80) - Gateway
- auth-service (port 5001) - Authentication
- quiz-service (port 5002) - Quiz management
- execution-service (port 5003) - Quiz execution

---

## For Your Thesis

The generated comparison report (`performance-comparison-report.md`) includes:

✅ Detailed metrics comparison
✅ Performance analysis
✅ Architecture advantages/disadvantages
✅ Production recommendations
✅ Professional formatting for thesis inclusion

You can copy sections directly into your thesis document!

---

## Need Help?

If something doesn't work:

1. Check this README for troubleshooting steps
2. Verify both services are running (use `-CheckOnly`)
3. Check error messages for specific issues
4. Ensure Docker is running (for monolith)
5. Verify AWS services are up (for microservices)
