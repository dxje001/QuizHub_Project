# Deploy Frontend to AWS EC2

## What This Does

This deployment adds the React frontend to your AWS microservices architecture, making your complete QuizHub application accessible at:

**http://54.196.182.219**

## Architecture After Deployment

```
User Browser
     ↓
http://54.196.182.219 (AWS EC2)
     ↓
Nginx Gateway (port 80)
     ├─ "/" → Frontend (React SPA)
     ├─ "/api/auth/*" → Auth Service (port 5001)
     ├─ "/api/quiz/*" → Quiz Service (port 5002)
     └─ "/api/quiz/*/submit" → Execution Service (port 5003)
```

## Prerequisites

✅ Frontend Docker image: `dxje001/kvizhub-frontend:latest` (already pushed)
✅ Backend Docker image: `dxje001/kvizhub-backend:latest` (already pushed)
✅ AWS EC2 instance: 54.196.182.219 (already running)

## Deployment Steps

### Step 1: Copy Files to EC2

Copy the new configuration files to your EC2 instance:

```bash
# From your local machine (PowerShell or Command Prompt)
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2\aws-deployment"

scp -i YOUR_KEY.pem docker-compose-with-frontend.yml ec2-user@54.196.182.219:~/
scp -i YOUR_KEY.pem nginx-with-frontend.conf ec2-user@54.196.182.219:~/
```

### Step 2: SSH into EC2

```bash
ssh -i YOUR_KEY.pem ec2-user@54.196.182.219
```

### Step 3: Stop Current Containers

```bash
# Stop the current microservices (without frontend)
docker-compose down
```

### Step 4: Pull New Images

```bash
# Pull the frontend image
docker pull dxje001/kvizhub-frontend:latest

# Pull latest backend image (if updated)
docker pull dxje001/kvizhub-backend:latest
```

### Step 5: Start with New Configuration

```bash
# Start with the new docker-compose file that includes frontend
docker-compose -f docker-compose-with-frontend.yml up -d
```

### Step 6: Verify Deployment

```bash
# Check all containers are running
docker ps

# Expected output: 5 containers
# - auth-service
# - quiz-service
# - execution-service
# - kvizhub-frontend
# - nginx-api-gateway

# Check logs
docker logs nginx-api-gateway
docker logs kvizhub-frontend

# Test health endpoint
curl http://localhost/health

# Test API endpoint
curl http://localhost/api/quiz
```

### Step 7: Test from Your Browser

Open: **http://54.196.182.219**

You should see the QuizHub React frontend!

## Verification Checklist

- [ ] Frontend loads: http://54.196.182.219
- [ ] Can browse quizzes
- [ ] Can register/login
- [ ] Can take a quiz
- [ ] Can see leaderboard
- [ ] All API calls go to microservices (check browser DevTools Network tab)

## Troubleshooting

### Frontend doesn't load

```bash
# Check frontend container
docker logs kvizhub-frontend

# Check nginx configuration
docker exec nginx-api-gateway nginx -t

# Restart nginx
docker restart nginx-api-gateway
```

### CORS errors

The Nginx configuration includes `proxy_hide_header` directives to prevent duplicate CORS headers. If you still see CORS errors:

```bash
# Check nginx logs
docker logs nginx-api-gateway

# Verify CORS headers
curl -I http://54.196.182.219/api/quiz
```

### API not working

```bash
# Check backend services
docker logs auth-service
docker logs quiz-service
docker logs execution-service

# Test services directly
curl http://localhost:5001/api/auth/health
curl http://localhost:5002/api/quiz
curl http://localhost:5003/api/quiz/attempts
```

## Rollback

If something goes wrong, rollback to the previous configuration:

```bash
# Stop new setup
docker-compose -f docker-compose-with-frontend.yml down

# Start old setup (without frontend)
docker-compose -f docker-compose-fixed.yml up -d
```

## What Changed

### Before (Backend only):
- 3 backend microservices
- 1 Nginx gateway (API routing only)
- Frontend runs locally on your machine

### After (Full stack):
- 3 backend microservices
- 1 frontend container
- 1 Nginx gateway (serves frontend + routes API)
- **Everything on AWS - accessible from anywhere**

## Next Steps

Once deployed and verified:

1. **Update local .env** - Your local frontend should continue using AWS:
   ```
   VITE_API_URL=http://54.196.182.219
   ```

2. **Run performance tests** - Compare monolith (localhost) vs microservices (AWS):
   ```powershell
   cd performance-tests
   .\run-comparison-tests.ps1
   ```

3. **Generate Serbian Cyrillic report**:
   ```bash
   python analyze-results-serbian.py
   ```

## Architecture Comparison for Your Thesis

### Monolithic (Localhost)
- Frontend: localhost:3050
- Backend: localhost:5000
- Database: localhost:5432
- **All containers share same Docker network on one machine**

### Microservices (AWS)
- Frontend: AWS EC2 (54.196.182.219)
- Auth Service: AWS EC2 port 5001
- Quiz Service: AWS EC2 port 5002
- Execution Service: AWS EC2 port 5003
- Database: AWS RDS (separate instance)
- Nginx Gateway: Routes traffic to appropriate service
- **Distributed architecture with service isolation**

This gives you a perfect comparison for your thesis!
