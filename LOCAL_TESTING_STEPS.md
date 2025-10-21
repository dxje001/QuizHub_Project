# Local Testing Guide - Step by Step

## ✅ Prerequisites Ready
- Docker Desktop: **Installed** (version 27.3.1)
- Docker Compose: **Installed** (version 2.30.3)
- .env file: **Exists**

---

## 🎯 Testing Plan (60-90 minutes)

1. **Test Monolith** (20 min)
2. **Test Microservices** (20 min)
3. **Run Performance Tests** (30 min)
4. **Compare Results** (10 min)

---

## Phase 1: Test Monolith Architecture (20 minutes)

### Step 1.1: Start Docker Desktop
- ✅ Open Docker Desktop from Start menu
- ✅ Wait for green "Docker Desktop is running" status

### Step 1.2: Start Monolith

Open PowerShell and run:

```powershell
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"

# Start monolith
docker compose up -d
```

**Expected output:**
```
[+] Running 4/4
 ✔ Network kvizhub-network      Created
 ✔ Volume "w2_postgres_data"    Created
 ✔ Container kvizhub-postgres   Started
 ✔ Container kvizhub-backend    Started
 ✔ Container kvizhub-frontend   Started
```

**Wait 30-60 seconds** for services to start.

### Step 1.3: Verify Monolith is Running

Check running containers:
```powershell
docker ps
```

You should see 3 containers:
- `kvizhub-postgres` (database)
- `kvizhub-backend` (ASP.NET API)
- `kvizhub-frontend` (React app)

### Step 1.4: Test Monolith in Browser

**Open these URLs in your browser:**

1. **Frontend:** http://localhost:3050
   - Should load QuizHub homepage

2. **Backend API:** http://localhost:5000/swagger
   - Should show Swagger API documentation

3. **Backend Health:** http://localhost:5000/health
   - Should return "Healthy"

### Step 1.5: Test Functionality

1. Click **"Register"** on frontend
2. Create a test account:
   - Email: `test@example.com`
   - Password: `Test123!`
3. Click **"Login"**
4. Browse quizzes (should load empty list or sample data)

**✅ If you can register/login successfully, monolith works!**

### Step 1.6: Check Logs (Optional)

```powershell
# View all logs
docker compose logs

# View backend logs only
docker compose logs backend

# Follow logs in real-time
docker compose logs -f backend
```

### Step 1.7: Stop Monolith

```powershell
docker compose down
```

---

## Phase 2: Test Microservices Architecture (20 minutes)

### Step 2.1: Start Microservices

```powershell
# Start microservices simulation
docker compose -f docker-compose.microservices-simulation.yml up -d
```

**Expected output:**
```
[+] Running 7/7
 ✔ Network microservices-network      Created
 ✔ Container kvizhub-postgres-micro   Started
 ✔ Container auth-service             Started
 ✔ Container quiz-service             Started
 ✔ Container execution-service        Started
 ✔ Container nginx-api-gateway        Started
 ✔ Container kvizhub-frontend-micro   Started
```

**Wait 60-90 seconds** for all services to start (more containers = more time).

### Step 2.2: Verify Microservices are Running

```powershell
docker ps
```

You should see 6 containers:
- `kvizhub-postgres-micro` (database)
- `auth-service` (authentication API)
- `quiz-service` (quiz management API)
- `execution-service` (quiz execution API)
- `nginx-api-gateway` (API gateway/router)
- `kvizhub-frontend-micro` (React app)

### Step 2.3: Test Microservices in Browser

**Open these URLs:**

1. **Frontend:** http://localhost:3051
   - Should load QuizHub homepage

2. **Nginx Gateway Health:** http://localhost:8080/health
   - Should return "Microservices Gateway OK"

3. **Individual Services:**
   - Auth Service: http://localhost:5001/health
   - Quiz Service: http://localhost:5002/health
   - Execution Service: http://localhost:5003/health

### Step 2.4: Test Functionality

Same as monolith:
1. Register account: `test2@example.com` / `Test123!`
2. Login
3. Browse quizzes

**✅ If you can register/login successfully, microservices work!**

### Step 2.5: Check Logs

```powershell
# All services
docker compose -f docker-compose.microservices-simulation.yml logs

# Specific service
docker logs auth-service
docker logs quiz-service
docker logs nginx-api-gateway

# Follow in real-time
docker logs -f nginx-api-gateway
```

### Step 2.6: Stop Microservices

```powershell
docker compose -f docker-compose.microservices-simulation.yml down
```

---

## Phase 3: Performance Testing (30 minutes)

### Step 3.1: Install K6 (Load Testing Tool)

**Option A: Using Chocolatey (Recommended)**
```powershell
choco install k6
```

**Option B: Download Installer**
1. Go to: https://dl.k6.io/msi/k6-latest-amd64.msi
2. Download and install
3. Restart PowerShell

**Verify installation:**
```powershell
k6 version
```

### Step 3.2: Run Automated Performance Test

I've created an automated script that tests both architectures and compares them!

```powershell
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"

# Run automated test (this takes ~45 minutes total)
.\aws-deployment\testing\run-tests.ps1 `
    -MonolithUrl "http://localhost:5000" `
    -MicroservicesUrl "http://localhost:8080"
```

**What this does:**
1. Starts monolith
2. Runs 22-minute load test
3. Stops monolith
4. Starts microservices
5. Runs 22-minute load test
6. Generates comparison report

**⚠️ This is a full test. For quick testing, see Step 3.3 below.**

### Step 3.3: Quick Performance Test (5 minutes each)

**Test Monolith (quick):**
```powershell
# Start monolith
docker compose up -d

# Wait 30 seconds
Start-Sleep -Seconds 30

# Run quick test
cd aws-deployment\testing
$env:API_URL = "http://localhost:5000"
k6 run --duration 5m --vus 50 load-test.js

# Stop monolith
cd ..\..
docker compose down
```

**Test Microservices (quick):**
```powershell
# Start microservices
docker compose -f docker-compose.microservices-simulation.yml up -d

# Wait 60 seconds
Start-Sleep -Seconds 60

# Run quick test
cd aws-deployment\testing
$env:API_URL = "http://localhost:8080"
k6 run --duration 5m --vus 50 load-test.js

# Stop microservices
cd ..\..
docker compose -f docker-compose.microservices-simulation.yml down
```

---

## Phase 4: Review Results (10 minutes)

### Step 4.1: Check Test Results

After tests complete, check the results:

```powershell
# View comparison report
cat aws-deployment\testing\results\comparison-report-*.md

# Or open in editor
code aws-deployment\testing\results\comparison-report-*.md
```

### Step 4.2: Expected Results

**Typical local test results:**

| Metric | Monolith | Microservices | Difference |
|--------|----------|---------------|------------|
| Avg Response Time | 150-200ms | 180-250ms | +20-30% slower |
| P95 Response Time | 300-400ms | 400-550ms | +30-40% slower |
| Requests/sec | 30-40 | 25-35 | -15-20% lower |
| Error Rate | <1% | <1% | Similar |

**Why microservices are slower locally:**
- ✅ Nginx routing overhead (~10-30ms per request)
- ✅ Multiple containers compete for CPU/RAM on same machine
- ✅ Network calls between containers (even though local)

**This is EXPECTED and GOOD for your thesis!**

---

## Troubleshooting

### Problem: "Port already in use"

**Solution:**
```powershell
# Stop all containers
docker compose down
docker compose -f docker-compose.microservices-simulation.yml down

# Check what's using the port
netstat -ano | findstr :5000
netstat -ano | findstr :3050

# Kill process if needed
taskkill /PID <PID_NUMBER> /F
```

### Problem: "Cannot connect to Docker daemon"

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start (green icon)
3. Try again

### Problem: "Container exits immediately"

**Solution:**
```powershell
# Check logs
docker logs kvizhub-backend

# Common issues:
# - Database not ready yet (wait 30 seconds and try again)
# - Port conflict (stop other containers)
# - Build error (check Dockerfile)
```

### Problem: "Database connection failed"

**Solution:**
```powershell
# Make sure PostgreSQL is running
docker ps | findstr postgres

# Check PostgreSQL logs
docker logs kvizhub-postgres

# Restart if needed
docker restart kvizhub-postgres
```

### Problem: "Frontend can't connect to backend"

**Solution:**
1. Check backend is running: `docker ps`
2. Test backend directly: `curl http://localhost:5000/health`
3. Check browser console for CORS errors
4. Verify .env has correct API URL

---

## Success Checklist

Before moving to AWS deployment, verify:

✅ Monolith starts successfully
✅ Can register/login on monolith
✅ Microservices start successfully
✅ Can register/login on microservices
✅ All 6 microservice containers running
✅ Nginx gateway responds correctly
✅ K6 load tests complete without errors
✅ Have comparison results showing performance difference

---

## Next Steps

Once local testing is complete and working:

1. ✅ **Document local results** - Save comparison report
2. ✅ **Deploy to AWS** - Run `deploy-to-aws.ps1`
3. ✅ **Run AWS tests** - Compare cloud performance
4. ✅ **Write thesis** - Use both local and AWS data

---

## Quick Commands Reference

```powershell
# Start monolith
docker compose up -d

# Stop monolith
docker compose down

# Start microservices
docker compose -f docker-compose.microservices-simulation.yml up -d

# Stop microservices
docker compose -f docker-compose.microservices-simulation.yml down

# View all containers
docker ps

# View logs
docker compose logs
docker logs <container-name>

# Clean up everything
docker system prune -a
```

---

## Ready to Start?

**Step 1:** Make sure Docker Desktop is running (green icon in system tray)

**Step 2:** Run this command:

```powershell
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
docker compose up -d
```

**Step 3:** Wait 30 seconds, then open: http://localhost:3050

**Step 4:** Tell me if it works! 🚀
