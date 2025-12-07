#!/bin/bash
# STEP-BY-STEP FIX FOR EC2 MICROSERVICES
# Copy and paste this entire script into EC2 Instance Connect terminal

echo "=============================================="
echo "STEP 1: Navigate to project directory"
echo "=============================================="
cd ~/kvizhub
pwd

echo ""
echo "=============================================="
echo "STEP 2: Stop current containers"
echo "=============================================="
docker compose down

echo ""
echo "=============================================="
echo "STEP 3: Update docker-compose.yml (FIXED)"
echo "=============================================="
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

echo "✅ docker-compose.yml updated (ports changed to 8080)"

echo ""
echo "=============================================="
echo "STEP 4: Update nginx-aws.conf (FIXED)"
echo "=============================================="
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

echo "✅ nginx-aws.conf updated (upstream ports changed to 8080)"

echo ""
echo "=============================================="
echo "STEP 5: Start services with new configuration"
echo "=============================================="
docker compose up -d

echo ""
echo "=============================================="
echo "STEP 6: Wait 60 seconds for services to start"
echo "=============================================="
echo "Waiting for database initialization and service startup..."
for i in {60..1}; do
    echo -ne "Time remaining: $i seconds\r"
    sleep 1
done
echo ""

echo ""
echo "=============================================="
echo "STEP 7: Check container status"
echo "=============================================="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "=============================================="
echo "STEP 8: Test endpoints"
echo "=============================================="

echo ""
echo "Testing Gateway Health:"
curl -s http://localhost/health
echo ""

echo ""
echo "Testing Auth Service (port 5001):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5001/
echo ""

echo ""
echo "Testing Quiz Service (port 5002):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5002/
echo ""

echo ""
echo "Testing Execution Service (port 5003):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5003/
echo ""

echo ""
echo "=============================================="
echo "STEP 9: Check logs for errors"
echo "=============================================="

echo ""
echo "--- Auth Service (last 15 lines) ---"
docker logs auth-service --tail 15
echo ""

echo ""
echo "--- Quiz Service (last 15 lines) ---"
docker logs quiz-service --tail 15
echo ""

echo ""
echo "--- Execution Service (last 15 lines) ---"
docker logs execution-service --tail 15
echo ""

echo ""
echo "=============================================="
echo "✅ DEPLOYMENT COMPLETE!"
echo "=============================================="
echo ""
echo "Your microservices should now be accessible at:"
echo "  - http://54.196.182.219/health"
echo "  - http://54.196.182.219/api/auth/..."
echo "  - http://54.196.182.219/api/quiz/..."
echo ""
echo "If you see any errors above, run:"
echo "  docker logs <service-name> --tail 50"
echo ""
