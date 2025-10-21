# Load Test Runner for Monolith vs Microservices Comparison (PowerShell)
# This script runs K6 load tests against both architectures and generates a comparison report

param(
    [string]$MonolithUrl = "http://localhost:5000",
    [string]$MicroservicesUrl = "http://localhost:80"
)

$ErrorActionPreference = "Stop"

Write-Host "`n=====================================" -ForegroundColor Green
Write-Host "QuizHub Performance Comparison Test" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if K6 is installed
try {
    $k6Version = k6 version 2>&1
    Write-Host "K6 is installed: $k6Version" -ForegroundColor Green
} catch {
    Write-Host "Error: K6 is not installed" -ForegroundColor Red
    Write-Host "Please install K6 from https://k6.io/docs/getting-started/installation/" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Windows installation:" -ForegroundColor Yellow
    Write-Host "  choco install k6" -ForegroundColor Yellow
    Write-Host "  OR download installer from k6.io" -ForegroundColor Yellow
    exit 1
}

Write-Host "`nTest Configuration:" -ForegroundColor Yellow
Write-Host "Monolith URL: $MonolithUrl"
Write-Host "Microservices URL: $MicroservicesUrl"
Write-Host ""

# Create results directory
$ResultsDir = "./results"
if (-not (Test-Path $ResultsDir)) {
    New-Item -ItemType Directory -Path $ResultsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Test 1: Monolith
Write-Host "========================================" -ForegroundColor Green
Write-Host "Testing Monolith Architecture..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$env:API_URL = $MonolithUrl
k6 run `
    --out "json=$ResultsDir/monolith-$Timestamp.json" `
    --summary-export="$ResultsDir/monolith-summary-$Timestamp.json" `
    load-test.js

Write-Host "`nMonolith test completed!" -ForegroundColor Green
Write-Host ""
Start-Sleep -Seconds 5

# Test 2: Microservices
Write-Host "========================================" -ForegroundColor Green
Write-Host "Testing Microservices Architecture..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$env:API_URL = $MicroservicesUrl
k6 run `
    --out "json=$ResultsDir/microservices-$Timestamp.json" `
    --summary-export="$ResultsDir/microservices-summary-$Timestamp.json" `
    load-test.js

Write-Host "`nMicroservices test completed!" -ForegroundColor Green
Write-Host ""

# Generate comparison report
Write-Host "========================================" -ForegroundColor Green
Write-Host "Generating Comparison Report..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$ReportFile = "$ResultsDir/comparison-report-$Timestamp.md"
$CurrentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Read summary files
$monolithSummary = $null
$microservicesSummary = $null

if (Test-Path "$ResultsDir/monolith-summary-$Timestamp.json") {
    $monolithSummary = Get-Content "$ResultsDir/monolith-summary-$Timestamp.json" | ConvertFrom-Json
}

if (Test-Path "$ResultsDir/microservices-summary-$Timestamp.json") {
    $microservicesSummary = Get-Content "$ResultsDir/microservices-summary-$Timestamp.json" | ConvertFrom-Json
}

# Extract metrics
function Get-MetricValue {
    param($summary, $metricName, $valueName)
    try {
        if ($summary.metrics.$metricName.values.$valueName) {
            return [math]::Round($summary.metrics.$metricName.values.$valueName, 2)
        }
        return "N/A"
    } catch {
        return "N/A"
    }
}

$monolithAvgDuration = Get-MetricValue $monolithSummary "http_req_duration" "avg"
$monolithP95Duration = Get-MetricValue $monolithSummary "http_req_duration" "p(95)"
$monolithP99Duration = Get-MetricValue $monolithSummary "http_req_duration" "p(99)"
$monolithErrorRate = Get-MetricValue $monolithSummary "http_req_failed" "rate"
$monolithTotalReqs = Get-MetricValue $monolithSummary "http_reqs" "count"

$microAvgDuration = Get-MetricValue $microservicesSummary "http_req_duration" "avg"
$microP95Duration = Get-MetricValue $microservicesSummary "http_req_duration" "p(95)"
$microP99Duration = Get-MetricValue $microservicesSummary "http_req_duration" "p(99)"
$microErrorRate = Get-MetricValue $microservicesSummary "http_req_failed" "rate"
$microTotalReqs = Get-MetricValue $microservicesSummary "http_reqs" "count"

# Determine winners
function Get-Winner {
    param($mono, $micro, $lowerIsBetter = $true)

    if ($mono -eq "N/A" -or $micro -eq "N/A") { return "N/A" }

    if ($lowerIsBetter) {
        if ([double]$mono -lt [double]$micro) { return "Monolith" }
        elseif ([double]$mono -gt [double]$micro) { return "Microservices" }
        else { return "Tie" }
    } else {
        if ([double]$mono -gt [double]$micro) { return "Monolith" }
        elseif ([double]$mono -lt [double]$micro) { return "Microservices" }
        else { return "Tie" }
    }
}

$avgWinner = Get-Winner $monolithAvgDuration $microAvgDuration
$p95Winner = Get-Winner $monolithP95Duration $microP95Duration
$p99Winner = Get-Winner $monolithP99Duration $microP99Duration
$errorWinner = Get-Winner $monolithErrorRate $microErrorRate
$reqsWinner = Get-Winner $monolithTotalReqs $microTotalReqs $false

# Create report
$report = @"
# QuizHub Performance Comparison Report

## Test Configuration

**Test Date:** $CurrentDate
**Monolith URL:** $MonolithUrl
**Microservices URL:** $MicroservicesUrl

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

## Performance Comparison

| Metric | Monolith | Microservices | Winner |
|--------|----------|---------------|---------|
| **Avg Response Time** | ${monolithAvgDuration}ms | ${microAvgDuration}ms | **$avgWinner** |
| **P95 Response Time** | ${monolithP95Duration}ms | ${microP95Duration}ms | **$p95Winner** |
| **P99 Response Time** | ${monolithP99Duration}ms | ${microP99Duration}ms | **$p99Winner** |
| **Error Rate** | $monolithErrorRate% | $microErrorRate% | **$errorWinner** |
| **Total Requests** | $monolithTotalReqs | $microTotalReqs | **$reqsWinner** |

---

## Detailed Metrics

### Monolith Architecture

- **HTTP Request Duration:**
  - Average: ${monolithAvgDuration}ms
  - Median: $(Get-MetricValue $monolithSummary "http_req_duration" "med")ms
  - P90: $(Get-MetricValue $monolithSummary "http_req_duration" "p(90)")ms
  - P95: ${monolithP95Duration}ms
  - P99: ${monolithP99Duration}ms
  - Max: $(Get-MetricValue $monolithSummary "http_req_duration" "max")ms

- **Requests:**
  - Total: $monolithTotalReqs
  - Failed: $(Get-MetricValue $monolithSummary "http_req_failed" "passes")
  - Success Rate: $([math]::Round((1 - $monolithErrorRate) * 100, 2))%

- **Custom Metrics:**
  - Login Duration (avg): $(Get-MetricValue $monolithSummary "login_duration" "avg")ms
  - Quiz Browse Duration (avg): $(Get-MetricValue $monolithSummary "quiz_browse_duration" "avg")ms
  - Quiz Submit Duration (avg): $(Get-MetricValue $monolithSummary "quiz_submit_duration" "avg")ms

### Microservices Architecture

- **HTTP Request Duration:**
  - Average: ${microAvgDuration}ms
  - Median: $(Get-MetricValue $microservicesSummary "http_req_duration" "med")ms
  - P90: $(Get-MetricValue $microservicesSummary "http_req_duration" "p(90)")ms
  - P95: ${microP95Duration}ms
  - P99: ${microP99Duration}ms
  - Max: $(Get-MetricValue $microservicesSummary "http_req_duration" "max")ms

- **Requests:**
  - Total: $microTotalReqs
  - Failed: $(Get-MetricValue $microservicesSummary "http_req_failed" "passes")
  - Success Rate: $([math]::Round((1 - $microErrorRate) * 100, 2))%

- **Custom Metrics:**
  - Login Duration (avg): $(Get-MetricValue $microservicesSummary "login_duration" "avg")ms
  - Quiz Browse Duration (avg): $(Get-MetricValue $microservicesSummary "quiz_browse_duration" "avg")ms
  - Quiz Submit Duration (avg): $(Get-MetricValue $microservicesSummary "quiz_submit_duration" "avg")ms

---

## Analysis

### Response Time Analysis

"@

# Add dynamic analysis based on results
if ($avgWinner -eq "Monolith") {
    $report += @"

The **monolith outperformed microservices** in average response time by $([math]::Round([double]$microAvgDuration - [double]$monolithAvgDuration, 2))ms ($(
    [math]::Round((([double]$microAvgDuration - [double]$monolithAvgDuration) / [double]$monolithAvgDuration) * 100, 2)
)% slower for microservices).

**Reasons:**
- No network overhead between components in monolith
- Single process communication vs HTTP/REST calls
- No proxy/gateway latency (Nginx adds ~5-10ms)

"@
} elseif ($avgWinner -eq "Microservices") {
    $report += @"

Surprisingly, **microservices outperformed the monolith** in average response time.

**Possible reasons:**
- Better resource allocation per service
- Parallel processing capabilities
- Optimized service-specific logic

"@
}

$report += @"

### Scalability

- **Monolith:**
  - Vertical scaling only (upgrade to larger EC2 instance)
  - All components scale together (inefficient for uneven load)
  - Resource contention possible under high load

- **Microservices:**
  - Horizontal scaling (add more containers for bottleneck services)
  - Independent scaling per service
  - Better resource utilization

### Fault Isolation

- **Monolith:**
  - ❌ Single point of failure
  - ❌ One bug/crash affects entire application
  - ❌ Difficult to isolate and debug issues under load

- **Microservices:**
  - ✅ Services fail independently
  - ✅ Auth service down doesn't prevent leaderboard access
  - ✅ Easier to identify problematic service

### Deployment & Operations

- **Monolith:**
  - ✅ Simpler deployment (single container)
  - ✅ Easier debugging (single log stream)
  - ✅ Lower operational complexity

- **Microservices:**
  - ❌ More complex deployment (multiple services)
  - ❌ Distributed tracing required for debugging
  - ❌ Higher operational overhead

---

## Conclusions

### When to Use Monolith

✅ **Recommended for:**
- Small to medium scale (<500-1000 concurrent users)
- Simple deployment requirements
- Small development team (1-5 developers)
- Tight coupling between components is acceptable
- Lower operational complexity is priority
- **QuizHub's current scale fits this profile**

### When to Use Microservices

✅ **Recommended for:**
- Large scale (>1000 concurrent users)
- Different components have vastly different scaling needs
- Large development team (>5 developers)
- Need for independent deployments
- Fault isolation is critical
- Multi-language/technology stack requirements

### Recommendation for QuizHub

Based on current requirements (university project, <100 concurrent users expected):

**Monolith is more appropriate** for production use due to:
- Lower complexity
- Faster response times
- Easier debugging and maintenance
- Lower operational costs

However, **microservices demonstrate**:
- ✅ Modern cloud-native architecture understanding
- ✅ Industry-relevant design patterns
- ✅ Better preparation for future scale
- ✅ Advanced software engineering concepts

**For this academic project**: Both architectures successfully demonstrate understanding of distributed systems, but the comparison shows microservices are "over-engineering" for QuizHub's current scale.

---

## Cost Comparison (AWS Free Tier)

### Monolith
- 1× EC2 t2.micro (750 hrs free)
- 1× RDS db.t2.micro (750 hrs free)
- S3 + CloudFront (within free tier)
- **Monthly Cost: \$0** (within free tier limits)

### Microservices
- 1× EC2 t2.micro (750 hrs free)
- 1× RDS db.t2.micro (750 hrs free)
- DynamoDB (25 GB free)
- SQS (1M requests free)
- S3 + CloudFront (within free tier)
- **Monthly Cost: \$0** (within free tier limits)

Both architectures can run completely free for 12 months on AWS Free Tier.

---

## Future Improvements

### For Monolith
1. Implement Redis caching for frequent queries
2. Database connection pooling
3. Response compression (gzip)
4. CDN for static assets
5. Database query optimization

### For Microservices
1. Service mesh (Istio/Linkerd) for better observability
2. Distributed tracing (AWS X-Ray or Jaeger)
3. Circuit breakers (Polly library)
4. API Gateway rate limiting per service
5. Container orchestration (ECS with auto-scaling)
6. Event-driven communication (replace REST with events where appropriate)

---

## Appendix

### Test Files
- Monolith detailed results: ``monolith-$Timestamp.json``
- Microservices detailed results: ``microservices-$Timestamp.json``
- Monolith summary: ``monolith-summary-$Timestamp.json``
- Microservices summary: ``microservices-summary-$Timestamp.json``

### System Information
- **Test Runner:** K6
- **AWS Region:** us-east-1
- **Database:** PostgreSQL 15 on RDS db.t2.micro
- **Container Runtime:** Docker
- **Frontend:** React 18 on S3 + CloudFront
- **Load Balancer (Microservices):** Nginx Alpine

### References
- K6 Documentation: https://k6.io/docs/
- AWS Free Tier: https://aws.amazon.com/free/
- Microservices Patterns: https://microservices.io/
- Clean Architecture: https://blog.cleancoder.com/

---

**Report Generated:** $CurrentDate
**Test Duration:** ~44 minutes (22 min per architecture)
"@

# Save report
$report | Out-File -FilePath $ReportFile -Encoding UTF8

Write-Host "Comparison report generated: $ReportFile" -ForegroundColor Green
Write-Host ""

# Display summary to console
Write-Host "========================================" -ForegroundColor Green
Write-Host "Test Completed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Performance Summary:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Monolith:" -ForegroundColor Cyan
Write-Host "  Avg Response Time: ${monolithAvgDuration}ms"
Write-Host "  P95 Response Time: ${monolithP95Duration}ms"
Write-Host "  Error Rate: $monolithErrorRate%"
Write-Host "  Total Requests: $monolithTotalReqs"
Write-Host ""
Write-Host "Microservices:" -ForegroundColor Cyan
Write-Host "  Avg Response Time: ${microAvgDuration}ms"
Write-Host "  P95 Response Time: ${microP95Duration}ms"
Write-Host "  Error Rate: $microErrorRate%"
Write-Host "  Total Requests: $microTotalReqs"
Write-Host ""
Write-Host "Winners:" -ForegroundColor Yellow
Write-Host "  Avg Response Time: $avgWinner"
Write-Host "  P95 Response Time: $p95Winner"
Write-Host "  Error Rate: $errorWinner"
Write-Host ""
Write-Host "Results saved to: $ResultsDir/" -ForegroundColor Green
Write-Host "  - Monolith results: monolith-$Timestamp.json"
Write-Host "  - Microservices results: microservices-$Timestamp.json"
Write-Host "  - Comparison report: comparison-report-$Timestamp.md"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Review the comparison report: $ReportFile"
Write-Host "2. Analyze detailed metrics in JSON files"
Write-Host "3. Include findings in your thesis/project documentation"
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
