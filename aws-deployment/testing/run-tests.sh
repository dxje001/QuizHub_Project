#!/bin/bash

# Load Test Runner for Monolith vs Microservices Comparison
# This script runs K6 load tests against both architectures and generates a comparison report

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}QuizHub Performance Comparison Test${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Check if K6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}Error: K6 is not installed${NC}"
    echo "Please install K6 from https://k6.io/docs/getting-started/installation/"
    echo ""
    echo "Windows: choco install k6"
    echo "Mac: brew install k6"
    echo "Linux: sudo apt-get install k6"
    exit 1
fi

# Get URLs from command line or use defaults
MONOLITH_URL="${1:-http://localhost:5000}"
MICROSERVICES_URL="${2:-http://localhost:80}"

echo -e "${YELLOW}Test Configuration:${NC}"
echo "Monolith URL: $MONOLITH_URL"
echo "Microservices URL: $MICROSERVICES_URL"
echo ""

# Create results directory
RESULTS_DIR="./results"
mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Test 1: Monolith
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Testing Monolith Architecture...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

API_URL="$MONOLITH_URL" k6 run \
    --out json="$RESULTS_DIR/monolith-${TIMESTAMP}.json" \
    --summary-export="$RESULTS_DIR/monolith-summary-${TIMESTAMP}.json" \
    load-test.js

echo ""
echo -e "${GREEN}Monolith test completed!${NC}"
echo ""
sleep 5

# Test 2: Microservices
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Testing Microservices Architecture...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

API_URL="$MICROSERVICES_URL" k6 run \
    --out json="$RESULTS_DIR/microservices-${TIMESTAMP}.json" \
    --summary-export="$RESULTS_DIR/microservices-summary-${TIMESTAMP}.json" \
    load-test.js

echo ""
echo -e "${GREEN}Microservices test completed!${NC}"
echo ""

# Generate comparison report
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Generating Comparison Report...${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Create comparison report
REPORT_FILE="$RESULTS_DIR/comparison-report-${TIMESTAMP}.md"

cat > "$REPORT_FILE" << 'EOF'
# QuizHub Performance Comparison Report

## Test Configuration

**Test Date:** $(date)
**Monolith URL:** $MONOLITH_URL
**Microservices URL:** $MICROSERVICES_URL

## Test Scenarios

The load test simulated realistic user behavior:

1. **Authentication Flow**: User login with JWT token generation
2. **Browse Quizzes**: Fetch list of available quizzes
3. **Take Quiz**: Load quiz details and questions
4. **Submit Quiz**: Submit answers and calculate score
5. **View Leaderboard**: Fetch leaderboard rankings

## Load Profile

- Warmup: Ramp to 10 users (1 minute)
- Normal Load: 50 concurrent users (5 minutes)
- Peak Load: 100 concurrent users (5 minutes)
- Stress Test: 200 concurrent users (3 minutes)
- Total Duration: ~22 minutes

---

## Results Summary

### Monolith Architecture

EOF

# Extract key metrics from monolith summary
if [ -f "$RESULTS_DIR/monolith-summary-${TIMESTAMP}.json" ]; then
    echo "See detailed metrics in: monolith-summary-${TIMESTAMP}.json" >> "$REPORT_FILE"
else
    echo "Results file not found" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << 'EOF'

### Microservices Architecture

EOF

# Extract key metrics from microservices summary
if [ -f "$RESULTS_DIR/microservices-summary-${TIMESTAMP}.json" ]; then
    echo "See detailed metrics in: microservices-summary-${TIMESTAMP}.json" >> "$REPORT_FILE"
else
    echo "Results file not found" >> "$REPORT_FILE"
fi

cat >> "$REPORT_FILE" << 'EOF'

---

## Performance Comparison

| Metric | Monolith | Microservices | Winner |
|--------|----------|---------------|---------|
| Avg Response Time | - | - | - |
| P95 Response Time | - | - | - |
| P99 Response Time | - | - | - |
| Requests/sec | - | - | - |
| Error Rate | - | - | - |
| Total Requests | - | - | - |

**Note:** Fill in the metrics from the JSON summary files above.

---

## Analysis

### Response Time

- **Monolith**:
  - Lower latency expected due to no network hops between components
  - All requests handled within single process

- **Microservices**:
  - Additional network overhead for inter-service communication
  - Nginx proxy adds minimal latency (~5-10ms)

### Scalability

- **Monolith**:
  - Vertical scaling only (bigger server)
  - All components scale together (inefficient)

- **Microservices**:
  - Horizontal scaling (more instances)
  - Scale only bottleneck services (efficient)

### Fault Isolation

- **Monolith**:
  - Single point of failure
  - One bug can crash entire application

- **Microservices**:
  - Services can fail independently
  - Better fault tolerance

### Resource Utilization

- **Monolith**:
  - Single EC2 instance (1 GB RAM)
  - Simpler resource management

- **Microservices**:
  - Multiple containers on single EC2
  - Better resource allocation per service

---

## Conclusions

### When to Use Monolith

- ✅ Small to medium scale (<1000 concurrent users)
- ✅ Simple deployment requirements
- ✅ Small team (1-5 developers)
- ✅ Tight coupling between components is acceptable
- ✅ Lower operational complexity desired

### When to Use Microservices

- ✅ Large scale (>1000 concurrent users)
- ✅ Different scaling requirements for components
- ✅ Large team (>5 developers)
- ✅ Need for fault isolation
- ✅ Independent deployment of services required
- ✅ Technology flexibility needed

### Recommendation for QuizHub

Based on current requirements (small university project), **monolith is more appropriate**.
However, microservices demonstrate:
- Modern cloud-native architecture
- Better preparation for scale
- Industry-relevant design patterns

---

## Cost Comparison

### AWS Free Tier Usage

**Monolith:**
- 1x EC2 t2.micro (750 hrs free)
- 1x RDS db.t2.micro (750 hrs free)
- S3 + CloudFront (within free tier)
- **Estimated Cost:** $0/month

**Microservices:**
- 1x EC2 t2.micro (750 hrs free)
- 1x RDS db.t2.micro (750 hrs free)
- DynamoDB (25 GB free)
- SQS (1M requests free)
- S3 + CloudFront (within free tier)
- **Estimated Cost:** $0/month

Both architectures fit within AWS Free Tier limits for the first 12 months.

---

## Future Improvements

### For Monolith:
- Implement caching (Redis)
- Database connection pooling
- Response compression

### For Microservices:
- Service mesh (Istio/Linkerd)
- Distributed tracing (AWS X-Ray)
- Circuit breakers (Polly)
- API Gateway rate limiting
- Container orchestration (ECS/EKS)

---

## Appendix

### Test Files
- Monolith detailed results: `monolith-${TIMESTAMP}.json`
- Microservices detailed results: `microservices-${TIMESTAMP}.json`
- Load test script: `load-test.js`

### System Information
- Test Runner: K6
- AWS Region: us-east-1
- Database: PostgreSQL 15 on RDS db.t2.micro
- Container Runtime: Docker

EOF

echo -e "${GREEN}Comparison report generated: $REPORT_FILE${NC}"
echo ""

# Display summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Test Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Results saved to: $RESULTS_DIR/"
echo "  - Monolith results: monolith-${TIMESTAMP}.json"
echo "  - Microservices results: microservices-${TIMESTAMP}.json"
echo "  - Comparison report: comparison-report-${TIMESTAMP}.md"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the comparison report: cat $REPORT_FILE"
echo "2. Analyze detailed metrics in JSON files"
echo "3. Run additional tests if needed"
echo ""
echo -e "${GREEN}Done!${NC}"
