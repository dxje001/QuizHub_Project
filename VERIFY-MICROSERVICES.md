# How to Verify You're Using AWS Microservices

## In Browser Developer Tools (F12)

### Step-by-Step Verification:

1. **Open Developer Tools:** Press `F12`
2. **Go to Network Tab:** Click "Network" at the top
3. **Filter by XHR/Fetch:** Click "Fetch/XHR" filter button
4. **Refresh the page or perform an action** (like browsing quizzes)
5. **Look at the requests**

---

## What You Should See:

### ✅ Using AWS Microservices (CORRECT)

**Request URL should start with:**
```
http://54.196.182.219/api/...
```

**Examples of what you'll see:**
```
Name                        Status    Domain/File
quiz                        200       54.196.182.219
categories                  200       54.196.182.219
login                       200       54.196.182.219
register                    200       54.196.182.219
```

**Click on any request and check:**
- **Request URL:** `http://54.196.182.219/api/quiz`
- **Remote Address:** `54.196.182.219:80`
- **Response Headers:** Should include CORS headers from Nginx

---

### ❌ Using Local Monolith (WRONG if you want AWS)

**Request URL would start with:**
```
http://localhost:8080/api/...
or
http://localhost:5000/api/...
```

**Examples:**
```
Name                        Status    Domain/File
quiz                        200       localhost:8080
categories                  200       localhost:8080
```

---

## Quick Visual Test

### Test 1: Check Any API Request

1. Go to http://localhost:3050/
2. The app will load quizzes automatically
3. In Network tab, look for a request called **"quiz"**
4. Click on it
5. Look at **"General"** section → **"Request URL"**

**✅ Should be:** `http://54.196.182.219/api/quiz`
**❌ NOT:** `http://localhost:8080/api/quiz`

### Test 2: Login/Register

1. Try to register or login
2. Look for request called **"login"** or **"register"**
3. Click on it
4. Check **"Request URL"**

**✅ Should be:** `http://54.196.182.219/api/auth/login`
**❌ NOT:** `http://localhost:8080/api/auth/login`

### Test 3: Take a Quiz

1. Click on any quiz
2. Click "Take Quiz"
3. Look for request with **"/take"** in the name
4. Check **"Request URL"**

**✅ Should be:** `http://54.196.182.219/api/quiz/[id]/take`
**❌ NOT:** `http://localhost:8080/api/quiz/[id]/take`

---

## Screenshot Guide

Here's what the Network tab should look like:

### Headers Tab
```
General:
  Request URL: http://54.196.182.219/api/quiz
  Request Method: GET
  Status Code: 200 OK
  Remote Address: 54.196.182.219:80

Response Headers:
  access-control-allow-origin: *
  content-type: application/json
  server: nginx/1.29.2
```

The key indicators:
1. ✅ **Request URL contains:** `54.196.182.219`
2. ✅ **Server header says:** `nginx` (this is your gateway!)
3. ✅ **Remote Address:** `54.196.182.219:80`

---

## Alternative: Console Test

You can also check in the browser **Console** tab:

```javascript
// Paste this in Console and press Enter
console.log('API URL:', import.meta.env?.VITE_API_URL || 'http://localhost:5000')
```

**✅ Should print:** `API URL: http://54.196.182.219`

---

## Common Scenarios

### Scenario 1: All requests go to 54.196.182.219
**Status:** ✅ **Using AWS Microservices**
**What this means:** Your frontend is correctly configured for AWS

### Scenario 2: All requests go to localhost:8080 or localhost:5000
**Status:** ❌ **Using Local Monolith**
**Fix:**
1. Check `frontend/.env` file - should have `VITE_API_URL=http://54.196.182.219`
2. Restart frontend: Press Ctrl+C, then `npm run dev`

### Scenario 3: Mix of both
**Status:** ⚠️ **Configuration error**
**Fix:** Clear browser cache and restart frontend

### Scenario 4: No requests visible
**Status:** ⚠️ **Application not loading**
**Fix:** Check browser console for errors

---

## Detailed Request Example

When you click on a request in Network tab, you'll see:

### Headers Tab:
```
Request URL: http://54.196.182.219/api/quiz
Request Method: GET
Status Code: 200 OK
Remote Address: 54.196.182.219:80
Referrer Policy: strict-origin-when-cross-origin
```

### Response Tab:
```json
{
  "message": "Quizzes retrieved successfully",
  "data": {
    "data": [
      {
        "id": "c176ab2d-3b76-422d-8f77-9a75034eeb6e",
        "title": "React Development",
        ...
      }
    ]
  }
}
```

### Timing Tab:
You'll see longer times compared to local:
- **DNS Lookup:** ~20-50ms
- **Waiting (TTFB):** ~100-300ms (higher than local due to AWS)
- **Content Download:** ~5-20ms

**The higher TTFB (Time To First Byte) is expected with AWS!** This is the network latency you'll measure in performance tests.

---

## Quick Commands to Verify

### Check Frontend Config:
```bash
cd frontend
type .env
```
**Should show:** `VITE_API_URL=http://54.196.182.219`

### Test AWS Backend Directly:
```bash
curl http://54.196.182.219/health
```
**Should show:** `Microservices Gateway OK`

### Test Quiz Endpoint:
```bash
curl http://54.196.182.219/api/quiz
```
**Should return:** JSON with quiz data

---

## Summary Checklist

✅ **Request URLs contain:** `54.196.182.219`
✅ **Server header shows:** `nginx`
✅ **Remote Address is:** `54.196.182.219:80`
✅ **Response times are:** Higher than local (expected!)
✅ **CORS headers present:** `access-control-allow-origin: *`

**If all above are true → You're using AWS Microservices!** 🎉

---

## Still Not Sure?

### Ultimate Test:
1. **Stop your local Docker containers:**
   ```bash
   docker-compose down
   ```

2. **Refresh your application in browser**

3. **If the app still works → You're definitely using AWS!** ✅

4. **If the app breaks → You were using local, not AWS** ❌
   - Fix: Check `frontend/.env` and restart frontend

---

## What Each Service Handles

When you use the app, requests are routed to different microservices:

| Action | Request URL Pattern | Goes To Service |
|--------|-------------------|-----------------|
| Login/Register | `/api/auth/login` | **auth-service** (port 5001) |
| Browse Quizzes | `/api/quiz` | **quiz-service** (port 5002) |
| Get Categories | `/api/quiz/categories` | **quiz-service** (port 5002) |
| Take Quiz | `/api/quiz/{id}/take` | **execution-service** (port 5003) |
| Submit Quiz | `/api/quiz/{id}/submit` | **execution-service** (port 5003) |

But you'll see them all as `http://54.196.182.219/api/...` because **Nginx Gateway** routes them internally!

---

**Now go check your Network tab and look for `54.196.182.219` in the Request URLs!** 🔍
