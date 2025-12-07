# How to Use QuizHub Application

## Quick Answer: YES! You can use the full application with AWS microservices! 🎉

Your microservices on AWS have **ALL the same functionality** as the monolith. The frontend just needs to know which backend to connect to.

---

## Option 1: Use with AWS Microservices (Recommended for Testing)

### Step 1: Configure Frontend for AWS

```bash
cd frontend

# Copy AWS configuration
copy .env.aws .env
```

Or manually edit `frontend/.env` and change:
```
VITE_API_URL=http://54.196.182.219
```

### Step 2: Start Frontend

```bash
npm run dev
```

### Step 3: Open Application

Open your browser to: **http://localhost:5173**

**That's it!** The application now uses AWS microservices! 🚀

---

## Option 2: Use with Local Monolith

### Step 1: Start Local Backend

```bash
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
docker-compose up -d
```

### Step 2: Configure Frontend for Local

```bash
cd frontend

# Copy local configuration
copy .env.local .env
```

Or manually edit `frontend/.env` and change:
```
VITE_API_URL=http://localhost:8080
```

### Step 3: Start Frontend

```bash
npm run dev
```

### Step 4: Open Application

Open your browser to: **http://localhost:5173**

---

## Quick Switch Scripts

I've created PowerShell scripts to make switching easier:

### Switch to AWS Microservices

```powershell
.\use-aws.ps1
```

Then run: `cd frontend && npm run dev`

### Switch to Local Monolith

```powershell
.\use-local.ps1
```

Then run: `cd frontend && npm run dev`

---

## What Works on AWS Microservices?

**Everything!** Your AWS microservices have ALL the same features:

✅ **Authentication** (Login, Register, Logout)
- Handled by: `auth-service` (port 5001)
- Routes: `/api/auth/*`

✅ **Quiz Management** (Create, Edit, Delete Quizzes)
- Handled by: `quiz-service` (port 5002)
- Routes: `/api/quiz/*` (except execution)

✅ **Quiz Taking & Execution** (Take Quiz, Submit Answers)
- Handled by: `execution-service` (port 5003)
- Routes: `/api/quiz/*/take`, `/api/quiz/*/submit`, `/api/quiz/attempts`

✅ **Categories & Search**
- Handled by: `quiz-service` (port 5002)
- Routes: `/api/quiz/categories`, etc.

✅ **User Profiles**
- Handled by: `auth-service` (port 5001)
- Routes: `/api/auth/profile`

**The Nginx gateway automatically routes requests to the right service!**

---

## Verifying It Works

### Test Backend Directly

**AWS Microservices:**
```bash
curl http://54.196.182.219/api/quiz
curl http://54.196.182.219/api/quiz/categories
curl http://54.196.182.219/health
```

**Local Monolith:**
```bash
curl http://localhost:8080/api/quiz
curl http://localhost:8080/api/quiz/categories
```

### Test Through Frontend

1. Open the application in browser (http://localhost:5173)
2. Try to register a new account
3. Login with credentials
4. Browse quizzes
5. Take a quiz
6. View results

**All features should work identically!**

---

## Current Frontend Configuration

To check which backend you're using:

```bash
cd frontend
type .env
```

You should see:
- `VITE_API_URL=http://54.196.182.219` (AWS)
- OR `VITE_API_URL=http://localhost:8080` (Local)

---

## Complete Usage Workflow

### For Performance Testing (Use Both)

**1. Test with Local Monolith:**
```bash
# Start backend
docker-compose up -d

# Configure frontend
cd frontend
copy .env.local .env

# Start frontend
npm run dev

# Use application, test features
# Then run K6 performance tests
```

**2. Test with AWS Microservices:**
```bash
# Backend already running on AWS (always on!)

# Configure frontend
cd frontend
copy .env.aws .env

# Restart frontend (Ctrl+C then npm run dev)
npm run dev

# Use application, test features
# Then run K6 performance tests
```

**3. Compare Results:**
- Both should have identical functionality
- Performance will differ (local faster, AWS more latency)
- This difference is what you'll analyze in your thesis!

---

## Differences You'll Notice

### Speed
- **Local Monolith:** Faster response times (no internet latency)
- **AWS Microservices:** Slightly slower (internet + multiple services)

### Reliability
- **Local Monolith:** Works only when Docker is running
- **AWS Microservices:** Always available (as long as EC2 is running)

### Functionality
- **BOTH ARE IDENTICAL!** Same features, same database schema, same APIs

---

## Troubleshooting

### Frontend shows "Network Error"

**Check which backend is configured:**
```bash
cd frontend
type .env
```

**If using AWS (`http://54.196.182.219`):**
- Check microservices: http://54.196.182.219/health
- Verify in browser, should show "Microservices Gateway OK"

**If using Local (`http://localhost:8080`):**
- Check monolith is running: `docker ps`
- Should see containers: backend, db, frontend

### "Cannot connect to backend"

**For AWS:**
- EC2 instance might be stopped - check AWS Console
- Security group might be blocking port 80

**For Local:**
- Docker might not be running
- Run: `docker-compose up -d`

### Changes in `.env` not applied

**Restart the frontend:**
```bash
# In frontend terminal, press Ctrl+C
npm run dev
```

Vite needs to be restarted to pick up `.env` changes.

---

## Important Note: Port Difference

**Backend ports are different:**

- **Local Monolith:** Backend runs on port **8080**
  - API: `http://localhost:8080/api/*`
  - But docker-compose maps it to port **5000** externally
  - So frontend can use either `http://localhost:5000` or `http://localhost:8080`

- **AWS Microservices:** Gateway runs on port **80** (standard HTTP)
  - API: `http://54.196.182.219/api/*`
  - Services internally use port 8080, but exposed through gateway

The `.env.local` uses port **8080** because that's what your monolith exposes.

---

## Summary

**YES, you can use the full application with AWS microservices!**

✅ All features work identically
✅ Same database, same data
✅ Same API endpoints
✅ Only difference: which server processes the requests

To use AWS microservices:
1. Edit `frontend/.env` to point to `http://54.196.182.219`
2. Start frontend with `npm run dev`
3. Use the application normally!

**For your thesis, you'll want to test BOTH configurations to compare performance while having identical functionality.**

---

## Quick Reference

| Configuration | Backend URL | When to Use |
|---------------|-------------|-------------|
| **Local Monolith** | `http://localhost:8080` | Faster, local testing, performance baseline |
| **AWS Microservices** | `http://54.196.182.219` | Cloud testing, scalability demo, thesis comparison |

Both have **100% identical functionality!** 🎉
