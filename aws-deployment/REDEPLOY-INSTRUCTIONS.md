# How to Redeploy with Fixed Configuration

## Problem Found
The application listens on port 8080 (configured in Program.cs), but the docker-compose was mapping port 80. This caused Nginx to fail connecting to the backend services (502 Bad Gateway errors).

## Solution
Updated configurations:
1. **nginx-aws.conf** - Changed upstream servers from port 80 to 8080
2. **docker-compose-fixed.yml** - Changed port mappings from `5001:80` to `5001:8080`

## Steps to Redeploy

### Option 1: Using EC2 Instance Connect (Browser Terminal)

1. **Connect to EC2 via browser:**
   - Go to AWS Console → EC2 → Instances
   - Select instance `kvizhub-instance`
   - Click "Connect" → "EC2 Instance Connect" → "Connect"

2. **Update the files on EC2:**

```bash
cd ~/kvizhub

# Update docker-compose.yml
cat > docker-compose.yml << 'EOF'
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
      - "8080:80"
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
EOF

# Update nginx configuration
cat > nginx-aws.conf << 'EOF'
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
EOF
```

3. **Restart the services:**

```bash
# Stop current containers
docker compose down

# Start with new configuration
docker compose up -d

# Wait for services to start
sleep 45

# Check status
docker ps

# Test services
echo "Testing Gateway:"
curl http://localhost/health

echo ""
echo "Testing Auth Service:"
curl http://localhost:5001/

echo ""
echo "View logs if needed:"
echo "docker logs auth-service --tail 20"
echo "docker logs quiz-service --tail 20"
echo "docker logs execution-service --tail 20"
```

### Option 2: Upload from Windows (if SSH works)

Run from PowerShell in the project directory:

```powershell
.\aws-deployment\redeploy-fixed.ps1
```

## Expected Result

After redeployment, these endpoints should work:
- http://54.196.182.219/health - Gateway health check
- http://54.196.182.219:5001/ - Auth service (Swagger UI or 404 for root)
- http://54.196.182.219:5002/ - Quiz service
- http://54.196.182.219:5003/ - Execution service
- http://54.196.182.219/api/auth/* - Auth API through gateway
- http://54.196.182.219/api/quiz/* - Quiz API through gateway
