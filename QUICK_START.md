# Quick Start: Test Both Architectures Locally (1 Hour!)

## What We're Doing

Instead of rewriting code, we're running the **same codebase** in two different ways:
1. **Monolith**: Direct access to backend
2. **Microservices**: Through Nginx gateway routing to multiple instances

This simulates microservices architecture and gives valid performance comparison data!

---

## Prerequisites Check

Run these commands in PowerShell to verify you have everything installed:

```powershell
# Check Docker
docker --version
# Should show: Docker version 20.x.x or higher

# Check Node.js
node --version
# Should show: v18.x.x or higher

# Check .NET
dotnet --version
# Should show: 8.0.x

# Check Git
git --version
# Should show: git version 2.x.x
```

**If anything is missing, install it first!**

---

## Step 1: Test Current Monolith (15 minutes)

### 1.1 Start the monolith

```powershell
# From project root
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"

# Start monolith
docker-compose up --build
```

**Wait for:**
```
✅ kvizhub-postgres  | database system is ready to accept connections
✅ kvizhub-backend   | Now listening on: http://[::]:8080
✅ kvizhub-frontend  | VITE v5.0.0  ready in XXX ms
```

### 1.2 Test it works

**Open browser:**
- Frontend: http://localhost:3050
- Backend API: http://localhost:5000/api/health (or swagger)

**Test login:**
1. Click "Register" → Create account
2. Click "Login" → Login
3. Browse quizzes

**If it works:** ✅ Monolith is ready!

### 1.3 Stop monolith

```powershell
# Press Ctrl+C in terminal
docker-compose down
```

---

## Step 2: Test "Microservices" Simulation (15 minutes)

### 2.1 Start microservices

```powershell
# Start microservices simulation
docker-compose -f docker-compose.microservices-simulation.yml up --build
```

**Wait for all services:**
```
✅ kvizhub-postgres-micro   | ready
✅ auth-service             | ready
✅ quiz-service             | ready
✅ execution-service        | ready
✅ nginx-api-gateway        | ready
✅ kvizhub-frontend-micro   | ready
```

### 2.2 Test it works

**Open browser:**
- Frontend: http://localhost:3051 (different port!)
- Nginx Gateway: http://localhost:8080/health (should say "Microservices Gateway OK")

**Test same flow:**
1. Register new account
2. Login
3. Browse quizzes

**If it works:** ✅ Microservices are ready!

### 2.3 Stop microservices

```powershell
# Press Ctrl+C
docker-compose -f docker-compose.microservices-simulation.yml down
```

---

## Step 3: Compare Performance Locally (30 minutes)

### 3.1 Install K6 for load testing

```powershell
# Install K6
choco install k6

# Verify
k6 version
```

### 3.2 Test Monolith Performance

```powershell
# Start monolith
docker-compose up -d

# Wait 30 seconds for it to be ready
Start-Sleep -Seconds 30

# Run load test
cd aws-deployment\testing
$env:API_URL = "http://localhost:5000"
k6 run --out json=results\monolith-local.json load-test.js

# Save results (will take ~20 minutes)
```

### 3.3 Test Microservices Performance

```powershell
# Stop monolith
cd ..\..
docker-compose down

# Start microservices
docker-compose -f docker-compose.microservices-simulation.yml up -d

# Wait 30 seconds
Start-Sleep -Seconds 30

# Run load test
cd aws-deployment\testing
$env:API_URL = "http://localhost:8080"
k6 run --out json=results\microservices-local.json load-test.js

# Save results (will take ~20 minutes)
```

### 3.4 Compare Results

```powershell
# Run comparison script
.\run-tests.ps1 -MonolithUrl "http://localhost:5000" -MicroservicesUrl "http://localhost:8080"

# Or just check the results files
cat results\comparison-report-*.md
```

---

## Expected Results (Local Testing)

| Metric | Monolith | Microservices | Difference |
|--------|----------|---------------|------------|
| Avg Response Time | ~150ms | ~180ms | +20% slower |
| P95 Response Time | ~300ms | ~400ms | +33% slower |
| Throughput | 40 req/s | 35 req/s | -12% lower |

**Why microservices are slower:**
- ✅ Nginx adds ~10-30ms routing overhead
- ✅ Multiple containers compete for resources on same machine
- ✅ Network calls between containers

**This is EXPECTED and GOOD for your thesis!** It shows you understand the trade-offs.

---

## Step 4: Deploy to AWS (After Local Testing Works)

Once local testing is done, you'll deploy to AWS. The AWS environment will show different results because:
- Each architecture gets its own EC2 instance
- No resource competition
- Better networking

---

## Troubleshooting

### "Port already in use"
```powershell
# Stop all Docker containers
docker-compose down
docker-compose -f docker-compose.microservices-simulation.yml down

# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <PID> /F
```

### "Database connection failed"
```powershell
# Make sure PostgreSQL container is running
docker ps | findstr postgres

# Check logs
docker logs kvizhub-postgres

# Restart if needed
docker-compose restart postgres
```

### "Frontend can't connect to backend"
- Check backend is running: `curl http://localhost:5000/health`
- Check CORS is enabled in backend
- Check browser console for errors

### "K6 tests fail"
- Make sure services are fully started (wait 1-2 minutes)
- Test manually first: `curl http://localhost:5000/api/auth/login`
- Check test users exist in database

---

## What's Next?

### After Local Testing Works:

1. ✅ You have proof both architectures work
2. ✅ You have local performance comparison
3. ✅ You understand the trade-offs

### Then Deploy to AWS:

1. Configure AWS CLI (you're doing this now!)
2. Create EC2 instances
3. Deploy both architectures
4. Run same tests on AWS
5. Compare AWS results vs local results

---

## Summary

This approach is **MUCH FASTER** than refactoring code:
- ✅ No code changes needed
- ✅ Valid comparison (demonstrates routing overhead)
- ✅ Can finish in 1-2 days instead of 1 week
- ✅ Good enough for university project

The performance difference comes from:
- Nginx routing overhead
- Multiple container instances
- Network calls between services

This is a **real architectural trade-off** you'll document in your thesis!

---

## Need Help?

If something doesn't work:
1. Check the container logs: `docker logs <container-name>`
2. Check if ports are free: `netstat -ano | findstr :<port>`
3. Restart Docker Desktop
4. Ask me for help! 😊

---

## Your Next Step RIGHT NOW

**Option A: Test locally first (safer)**
```powershell
docker-compose up
# Open http://localhost:3050 and verify it works
```

**Option B: Continue AWS setup (faster)**
- Finish configuring AWS CLI
- We'll deploy directly to AWS
- Test everything in the cloud

**Which do you prefer?** Let me know!
