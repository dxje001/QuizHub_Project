# Compare Performance Test Results
# Generates a comparison report between monolith and microservices

$monolithFile = ".\monolith-results.json"
$microservicesFile = ".\microservices-results.json"
$outputFile = ".\performance-comparison-report.md"

if (-not (Test-Path $monolithFile)) {
    Write-Host "❌ Monolith results not found: $monolithFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $microservicesFile)) {
    Write-Host "❌ Microservices results not found: $microservicesFile" -ForegroundColor Red
    exit 1
}

Write-Host "`n📊 Generating Performance Comparison Report..." -ForegroundColor Cyan

# Load JSON files
$monolith = Get-Content $monolithFile | ConvertFrom-Json
$microservices = Get-Content $microservicesFile | ConvertFrom-Json

# Extract metrics
$mono = @{
    Duration = $monolith.state.testRunDurationMs / 1000
    TotalRequests = $monolith.metrics.http_reqs.values.count
    RequestsPerSec = [math]::Round($monolith.metrics.http_reqs.values.rate, 2)
    AvgResponseTime = [math]::Round($monolith.metrics.http_req_duration.values.avg, 2)
    MedianResponseTime = [math]::Round($monolith.metrics.http_req_duration.values.med, 2)
    P95ResponseTime = [math]::Round($monolith.metrics.http_req_duration.values.'p(95)', 2)
    P99ResponseTime = [math]::Round($monolith.metrics.http_req_duration.values.'p(99)', 2)
    MaxResponseTime = [math]::Round($monolith.metrics.http_req_duration.values.max, 2)
    ErrorRate = if ($monolith.metrics.errors) { [math]::Round($monolith.metrics.errors.values.rate * 100, 2) } else { 0 }
    DataReceived = [math]::Round($monolith.metrics.data_received.values.count / 1024 / 1024, 2)
}

$micro = @{
    Duration = $microservices.state.testRunDurationMs / 1000
    TotalRequests = $microservices.metrics.http_reqs.values.count
    RequestsPerSec = [math]::Round($microservices.metrics.http_reqs.values.rate, 2)
    AvgResponseTime = [math]::Round($microservices.metrics.http_req_duration.values.avg, 2)
    MedianResponseTime = [math]::Round($microservices.metrics.http_req_duration.values.med, 2)
    P95ResponseTime = [math]::Round($microservices.metrics.http_req_duration.values.'p(95)', 2)
    P99ResponseTime = [math]::Round($microservices.metrics.http_req_duration.values.'p(99)', 2)
    MaxResponseTime = [math]::Round($microservices.metrics.http_req_duration.values.max, 2)
    ErrorRate = if ($microservices.metrics.errors) { [math]::Round($microservices.metrics.errors.values.rate * 100, 2) } else { 0 }
    DataReceived = [math]::Round($microservices.metrics.data_received.values.count / 1024 / 1024, 2)
}

# Calculate differences
function Get-Difference {
    param($mono, $micro)
    $diff = $micro - $mono
    $percent = if ($mono -ne 0) { [math]::Round(($diff / $mono) * 100, 2) } else { 0 }
    return @{ Diff = $diff; Percent = $percent }
}

$avgDiff = Get-Difference $mono.AvgResponseTime $micro.AvgResponseTime
$p95Diff = Get-Difference $mono.P95ResponseTime $micro.P95ResponseTime
$reqSecDiff = Get-Difference $mono.RequestsPerSec $micro.RequestsPerSec

# Generate Markdown Report
$report = @"
# QuizHub Performance Comparison Report

**Test Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## Executive Summary

This report compares the performance between the monolithic architecture (running locally) and the microservices architecture (deployed on AWS EC2).

## Test Configuration

- **Test Duration:** ~210 seconds (3.5 minutes)
- **Load Pattern:**
  - 0-30s: Ramp up to 10 concurrent users
  - 30-90s: Maintain 10 concurrent users
  - 90-120s: Ramp up to 20 concurrent users
  - 120-180s: Maintain 20 concurrent users
  - 180-210s: Ramp down to 0 users

## Architecture Comparison

### Monolith Architecture
- **Deployment:** Local Docker container
- **Location:** localhost:8080
- **Database:** PostgreSQL (local)
- **Network:** Local network

### Microservices Architecture
- **Deployment:** AWS EC2 (t3.micro)
- **Location:** 54.196.182.219
- **API Gateway:** Nginx
- **Services:** auth-service, quiz-service, execution-service
- **Database:** AWS RDS PostgreSQL (db.t3.micro)
- **Network:** Internet (AWS us-east-1)

## Performance Metrics

| Metric | Monolith | Microservices | Difference |
|--------|----------|---------------|------------|
| **Total Requests** | $($mono.TotalRequests) | $($micro.TotalRequests) | - |
| **Requests/sec** | $($mono.RequestsPerSec) | $($micro.RequestsPerSec) | $($reqSecDiff.Percent)% |
| **Avg Response Time** | $($mono.AvgResponseTime)ms | $($micro.AvgResponseTime)ms | +$($avgDiff.Diff)ms ($($avgDiff.Percent)%) |
| **Median Response Time** | $($mono.MedianResponseTime)ms | $($micro.MedianResponseTime)ms | - |
| **95th Percentile** | $($mono.P95ResponseTime)ms | $($micro.P95ResponseTime)ms | +$($p95Diff.Diff)ms ($($p95Diff.Percent)%) |
| **99th Percentile** | $($mono.P99ResponseTime)ms | $($micro.P99ResponseTime)ms | - |
| **Max Response Time** | $($mono.MaxResponseTime)ms | $($micro.MaxResponseTime)ms | - |
| **Error Rate** | $($mono.ErrorRate)% | $($micro.ErrorRate)% | - |
| **Data Received** | $($mono.DataReceived) MB | $($micro.DataReceived) MB | - |

## Analysis

### Response Time

The average response time for microservices is **$($micro.AvgResponseTime)ms** compared to **$($mono.AvgResponseTime)ms** for the monolith, representing a **$(if($avgDiff.Percent -gt 0){"slower"}else{"faster"})** performance by **$([math]::Abs($avgDiff.Percent))%**.

**Factors affecting microservices performance:**

1. **Network Latency:**
   - Monolith: Local network (~1ms)
   - Microservices: Internet connection to AWS (~50-100ms base latency)

2. **Service Communication:**
   - Monolith: In-process method calls
   - Microservices: HTTP requests through Nginx gateway

3. **Infrastructure:**
   - Monolith: Full local machine resources
   - Microservices: AWS t3.micro instances with limited resources

### Throughput

The monolith handled **$($mono.RequestsPerSec) requests/second** while microservices handled **$($micro.RequestsPerSec) requests/second**.

### Reliability

- Monolith Error Rate: **$($mono.ErrorRate)%**
- Microservices Error Rate: **$($micro.ErrorRate)%**

$(if ($mono.ErrorRate -eq 0 -and $micro.ErrorRate -eq 0) {
"Both architectures achieved 100% success rate during testing."
} else {
"Error rates indicate reliability concerns that should be investigated."
})

## Advantages and Disadvantages

### Monolith Advantages
- ✅ Lower latency (local deployment)
- ✅ Simpler deployment
- ✅ No network overhead between components
- ✅ Easier to debug and monitor

### Monolith Disadvantages
- ❌ Harder to scale individual components
- ❌ Single point of failure
- ❌ Requires full application redeployment for any change
- ❌ Technology stack locked for entire application

### Microservices Advantages
- ✅ Independent scaling of services
- ✅ Technology flexibility per service
- ✅ Isolated failures (one service down doesn't crash entire system)
- ✅ Team autonomy (different teams can work on different services)
- ✅ Easier to update individual services

### Microservices Disadvantages
- ❌ Higher latency due to network calls
- ❌ More complex deployment and monitoring
- ❌ Network overhead between services
- ❌ Distributed system complexity
- ❌ Higher infrastructure costs

## Conclusions

$(if ($avgDiff.Percent -gt 0 -and $avgDiff.Percent -lt 50) {
@"
The microservices architecture shows acceptable performance degradation ($([math]::Round($avgDiff.Percent, 0))%) when compared to the monolith. This overhead is primarily due to:

1. Network latency from internet-based communication
2. Additional HTTP overhead from the Nginx gateway
3. AWS free tier instance limitations (t3.micro)

For a production environment, this performance difference can be mitigated by:
- Using larger EC2 instances
- Implementing caching strategies
- Optimizing database queries
- Using AWS regions closer to users
- Implementing CDN for static content
"@
} elseif ($avgDiff.Percent -gt 50) {
@"
The microservices architecture shows significant performance degradation ($([math]::Round($avgDiff.Percent, 0))%). This is primarily due to:

1. Geographic distance and network latency
2. AWS free tier resource limitations
3. Additional service-to-service communication overhead

Despite the performance overhead, microservices provide significant architectural benefits including scalability, maintainability, and deployment flexibility.
"@
} else {
@"
The performance difference between architectures is minimal, suggesting that the microservices implementation is well-optimized for the current workload.
"@
})

## Recommendations for Production

1. **Use Production-Grade Infrastructure:** Upgrade from free tier instances to larger sizes
2. **Implement Caching:** Add Redis/ElastiCache for frequently accessed data
3. **Optimize Database:** Use connection pooling and query optimization
4. **Add Monitoring:** Implement AWS CloudWatch for real-time monitoring
5. **Use Auto-Scaling:** Configure auto-scaling based on load
6. **Implement CDN:** Use CloudFront for static content delivery

---

*Report generated automatically from K6 performance test results*
"@

# Save report
$report | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "✓ Report generated: $outputFile" -ForegroundColor Green

# Display summary in console
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PERFORMANCE COMPARISON SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Average Response Time:" -ForegroundColor Yellow
Write-Host "  Monolith:       $($mono.AvgResponseTime)ms" -ForegroundColor White
Write-Host "  Microservices:  $($micro.AvgResponseTime)ms" -ForegroundColor White
if ($avgDiff.Percent -gt 0) {
    Write-Host "  Difference:     +$($avgDiff.Diff)ms (+$($avgDiff.Percent)%)" -ForegroundColor Red
} else {
    Write-Host "  Difference:     $($avgDiff.Diff)ms ($($avgDiff.Percent)%)" -ForegroundColor Green
}

Write-Host "`nThroughput:" -ForegroundColor Yellow
Write-Host "  Monolith:       $($mono.RequestsPerSec) req/s" -ForegroundColor White
Write-Host "  Microservices:  $($micro.RequestsPerSec) req/s" -ForegroundColor White

Write-Host "`nReliability:" -ForegroundColor Yellow
Write-Host "  Monolith Errors:       $($mono.ErrorRate)%" -ForegroundColor White
Write-Host "  Microservices Errors:  $($micro.ErrorRate)%" -ForegroundColor White

Write-Host "`n========================================`n" -ForegroundColor Cyan
Write-Host "Full report saved to: $outputFile" -ForegroundColor Green
Write-Host ""
