#!/bin/bash
# Check microservices status on EC2

cd ~/kvizhub

echo "========================================="
echo "Checking Container Status"
echo "========================================="
echo ""

docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "========================================="
echo "Checking Container Logs (Last 20 lines)"
echo "========================================="

echo ""
echo "--- Auth Service Logs ---"
docker logs auth-service --tail 20

echo ""
echo "--- Quiz Service Logs ---"
docker logs quiz-service --tail 20

echo ""
echo "--- Execution Service Logs ---"
docker logs execution-service --tail 20

echo ""
echo "--- Nginx Gateway Logs ---"
docker logs nginx-api-gateway --tail 20

echo ""
echo "========================================="
echo "Testing Internal Connectivity"
echo "========================================="
echo ""

echo "Testing auth-service from nginx container:"
docker exec nginx-api-gateway wget -q -O- http://auth-service:80/health || echo "Failed to reach auth-service"

echo ""
echo "Testing quiz-service from nginx container:"
docker exec nginx-api-gateway wget -q -O- http://quiz-service:80/health || echo "Failed to reach quiz-service"

echo ""
echo "Testing execution-service from nginx container:"
docker exec nginx-api-gateway wget -q -O- http://execution-service:80/health || echo "Failed to reach execution-service"
