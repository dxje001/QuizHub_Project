# Quick Start Guide - Fix and Redeploy Microservices

## What's Wrong?
Your services are running but returning **502 Bad Gateway** because:
- App listens on port **8080** (hardcoded in Program.cs)
- Docker was mapping port **80** (wrong!)
- Nginx was trying to connect to port **80** (wrong!)

## The Fix
Change all ports from **80** to **8080** in docker-compose.yml and nginx-aws.conf

---

## STEP-BY-STEP INSTRUCTIONS

### Step 1: Open AWS Console
1. Go to https://console.aws.amazon.com/
2. Sign in to your account (485034933797)
3. Make sure region is **US East (N. Virginia)** / **us-east-1**

### Step 2: Connect to EC2
1. In AWS Console, search for "EC2" and click it
2. Click "Instances (running)" on the left sidebar
3. Find and select instance: **kvizhub-instance**
4. Click the **"Connect"** button at the top
5. Click **"EC2 Instance Connect"** tab
6. Click **"Connect"** button (opens browser terminal)

### Step 3: Run the Fix Script
Copy the **ENTIRE** script below and paste it into the EC2 terminal:

```bash
cd ~/kvizhub
docker compose down

cat > docker-compose.yml << 'DOCKERCOMPOSE'
version: '3.8'

services:
  auth-service:
    image: dxje001/kvizhub-backend:latest
    container_name: auth-service
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=kvizhub-db.c8fmu8q6u6th.us-east-1.rds.amazonaws.com;Database=kvizhub;Username=postgres;Password=KvizHub2024SecurePassword!
      - JwtSettings__Secret=your-super-secure-jwt-secret-key-here-make-it-long-and-random
      - JwtSettings__ExpiryHours=24
    ports:
      - "5001:8080"
    restart: unless-stopped
    mem_limit: 256m
    networks:
      - microservices-network

  quiz-service:
    image: dxje001/kvizhub-backend:latest
    container_name: quiz-service
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=kvizhub-db.c8fmu8q6u6th.us-east-1.rds.amazonaws.com;Database=kvizhub;Username=postgres;Password=KvizHub2024SecurePassword!
      - JwtSettings__Secret=your-super-secure-jwt-secret-key-here-make-it-long-and-random
      - JwtSettings__ExpiryHours=24
    ports:
      - "5002:8080"
    restart: unless-stopped
    mem_limit: 256m
    networks:
      - microservices-network

  execution-service:
    image: dxje001/kvizhub-backend:latest
    container_name: execution-service
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=kvizhub-db.c8fmu8q6u6th.us-east-1.rds.amazonaws.com;Database=kvizhub;Username=postgres;Password=KvizHub2024SecurePassword!
      - JwtSettings__Secret=your-super-secure-jwt-secret-key-here-make-it-long-and-random
      - JwtSettings__ExpiryHours=24
    ports:
      - "5003:8080"
    restart: unless-stopped
    mem_limit: 256m
    networks:
      - microservices-network

  nginx-gateway:
    image: nginx:alpine
    container_name: nginx-api-gateway
    ports:
      - "80:80"
    volumes:
      - ./nginx-aws.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - auth-service
      - quiz-service
      - execution-service
    restart: unless-stopped
    mem_limit: 128m
    networks:
      - microservices-network

networks:
  microservices-network:
    driver: bridge
DOCKERCOMPOSE

cat > nginx-aws.conf << 'NGINXCONF'
events {
    worker_connections 1024;
}

http {
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    upstream auth_service {
        server auth-service:8080;
    }

    upstream quiz_service {
        server quiz-service:8080;
    }

    upstream execution_service {
        server execution-service:8080;
    }

    server {
        listen 80;
        server_name _;

        location /health {
            access_log off;
            return 200 "Microservices Gateway OK\n";
            add_header Content-Type text/plain;
        }

        location /api/auth {
            proxy_pass http://auth_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/(?!.*/(submit|take|attempts)) {
            proxy_pass http://quiz_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/.*/take {
            proxy_pass http://execution_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/.*/submit {
            proxy_pass http://execution_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_read_timeout 300s;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location ~ ^/api/quiz/(attempts|leaderboard) {
            proxy_pass http://execution_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }

        location /api/ {
            proxy_pass http://quiz_service;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;

            if ($request_method = 'OPTIONS') {
                return 204;
            }
        }
    }
}
NGINXCONF

echo "Files updated! Starting services..."
docker compose up -d

echo ""
echo "Waiting 60 seconds for services to initialize..."
sleep 60

echo ""
echo "Checking status..."
docker ps

echo ""
echo "Testing services..."
curl http://localhost/health
curl -s -o /dev/null -w "\nAuth service: %{http_code}\n" http://localhost:5001/
curl -s -o /dev/null -w "Quiz service: %{http_code}\n" http://localhost:5002/
curl -s -o /dev/null -w "Execution service: %{http_code}\n" http://localhost:5003/

echo ""
echo "Checking logs..."
docker logs auth-service --tail 20
```

### Step 4: Wait for Results
The script will:
1. Stop old containers
2. Update configuration files
3. Start new containers
4. Wait 60 seconds for startup
5. Test all services
6. Show logs

### Step 5: Verify Success
You should see:
- ✅ "Microservices Gateway OK" from health endpoint
- ✅ HTTP Status 200 or 404 from services (404 is OK, means it's running!)
- ✅ No connection errors in logs

---

## Testing From Your Computer

After running the script, test these URLs in your browser:

1. **Gateway Health**: http://54.196.182.219/health
   - Should show: "Microservices Gateway OK"

2. **Auth Service**: http://54.196.182.219:5001/
   - Should show: 404 error page (this is normal!) or Swagger UI

3. **Quiz Service**: http://54.196.182.219:5002/
   - Should show: 404 error page (this is normal!) or Swagger UI

---

## Troubleshooting

### If services don't start:
```bash
docker logs auth-service --tail 50
docker logs quiz-service --tail 50
docker logs execution-service --tail 50
```

### If you see database errors:
Check RDS is running in AWS Console → RDS → Databases → kvizhub-db

### If containers keep restarting:
```bash
docker compose down
docker compose up -d
```

---

## What's Next?
Once services are running successfully:
1. ✅ Verify all endpoints work
2. ✅ Install K6 load testing tool
3. ✅ Run performance comparison tests
4. ✅ Generate thesis report

---

## Need Help?
If something goes wrong, paste the error message and I'll help you fix it!
