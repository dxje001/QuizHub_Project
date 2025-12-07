# Performance Testing Guide - Complete Instructions

## Overview

This testing suite compares the performance of **Monolith** vs **Microservices** architectures under different user loads (5, 20, and 50 concurrent users).

### What Gets Tested:
- ✅ Response times (average, median, 95th percentile)
- ✅ Throughput (requests per second)
- ✅ Error rates
- ✅ System behavior under increasing load

### Output for Thesis:
- 📊 Comparison graphs (PNG images)
- 📄 HTML report with all data
- 📈 Individual graphs ready for thesis
- 📋 JSON data for further analysis

---

## Prerequisites

### 1. Install Python & Dependencies

```bash
# Check if Python is installed
python --version

# Install matplotlib for graph generation
pip install matplotlib numpy
```

### 2. Ensure Services Are Running

**Local Monolith:**
```bash
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
docker-compose up -d
```

**AWS Microservices:**
- Should already be running on EC2
- Test: http://54.196.182.219/health

---

## Running the Tests

### Option 1: Run All Tests (Recommended)

```powershell
cd performance-tests
.\run-comparison-tests.ps1
```

**This will:**
1. Test monolith with 5, 20, and 50 users
2. Test microservices with 5, 20, and 50 users
3. Save results as JSON files
4. Take approximately **15-20 minutes**

### Option 2: Test Only Monolith

```powershell
.\run-comparison-tests.ps1 -SkipMicroservices
```

### Option 3: Test Only Microservices

```powershell
.\run-comparison-tests.ps1 -SkipMonolith
```

---

## Analyzing Results

After tests complete, run the Python analysis script:

```bash
python analyze-results.py
```

**This generates:**
- `performance-comparison-graphs.png` - All graphs in one image
- `graph-response-time-vs-users.png` - Response time comparison
- `graph-throughput-vs-users.png` - Throughput comparison
- `comparison-report.html` - Interactive HTML report

---

## Understanding the Test Scenarios

### Test Scenario 1: Light Load (5 Users)
```
Duration: 2 minutes
Concurrent Users: 5
Purpose: Baseline performance
Expected: Both architectures perform well
```

### Test Scenario 2: Medium Load (20 Users)
```
Duration: 2 minutes
Concurrent Users: 20
Purpose: Normal usage simulation
Expected: Performance differences become visible
```

### Test Scenario 3: Heavy Load (50 Users)
```
Duration: 2 minutes
Concurrent Users: 50
Purpose: Stress testing
Expected: Clear performance characteristics emerge
```

---

## What Each User Does (Test Workflow)

Each virtual user performs this sequence repeatedly:

1. **Browse Quizzes** - `GET /api/quiz`
2. **Get Categories** - `GET /api/quiz/categories`
3. **View Quiz Details** - `GET /api/quiz/{id}`
4. **Health Check** - `GET /health`
5. **Wait 1-2 seconds between requests** (realistic behavior)

This simulates real user behavior browsing the application.

---

## Expected Results

### Monolith (Local):
- ✅ **Response Time:** 20-100ms
- ✅ **Throughput:** High (40-80 req/s)
- ✅ **Error Rate:** ~0%
- **Why Fast:** Local network, no internet latency

### Microservices (AWS):
- ⚠️ **Response Time:** 100-400ms (2-5x slower)
- ⚠️ **Throughput:** Lower (20-40 req/s)
- ⚠️ **Error Rate:** ~0-2%
- **Why Slower:** Internet latency, Nginx gateway, AWS free tier

---

## Interpreting the Graphs

### Graph 1: Response Time vs User Load

```
Response Time (ms)
     ↑
 400 |              *  Microservices
     |            *
 300 |          *
     |        *
 200 |      *
     |    *
 100 |  o--o--o  Monolith
     |________________→
       5   20   50  Users
```

**Analysis:**
- Monolith stays relatively flat
- Microservices shows higher base latency
- Gap widens under heavy load

### Graph 2: Throughput vs User Load

```
Requests/sec
     ↑
  80 |  o
     |    o--o  Monolith
  60 |
  40 |      *--*
     |    *        Microservices
  20 |  *
     |________________→
       5   20   50  Users
```

**Analysis:**
- Monolith handles more requests
- Both may plateau at high loads
- Microservices limited by network

---

## Files Generated

### Test Results (Raw Data):
```
results-monolith-light_load.json
results-monolith-medium_load.json
results-monolith-heavy_load.json
results-microservices-light_load.json
results-microservices-medium_load.json
results-microservices-heavy_load.json
```

### Analysis Output:
```
performance-comparison-graphs.png     ← All graphs combined
graph-response-time-vs-users.png     ← For thesis
graph-throughput-vs-users.png        ← For thesis
comparison-report.html                ← Full report
```

---

## Including in Your Thesis

### 1. Copy Graphs to Thesis Folder

```bash
# Copy the thesis-ready graphs
copy graph-response-time-vs-users.png "C:\Your\Thesis\Folder\images\"
copy graph-throughput-vs-users.png "C:\Your\Thesis\Folder\images\"
```

### 2. Reference in Thesis

**LaTeX Example:**
```latex
\begin{figure}[h]
    \centering
    \includegraphics[width=0.8\textwidth]{images/graph-response-time-vs-users.png}
    \caption{Response Time Comparison: Monolith vs Microservices}
    \label{fig:response-time-comparison}
\end{figure}

As shown in Figure \ref{fig:response-time-comparison}, the microservices
architecture exhibits 2-5x higher latency compared to the monolithic
implementation, primarily due to network overhead and AWS infrastructure.
```

**Word Example:**
- Insert → Pictures → Select graph
- Add caption: "Figure 1: Response Time Comparison"
- Reference in text: "As shown in Figure 1..."

### 3. Include Python Code

Add the analysis script to your thesis appendix:

```
Appendix A: Performance Analysis Code
See analyze-results.py - Python script for automated analysis
```

---

## Troubleshooting

### Problem: "K6 not found"
**Solution:**
```powershell
winget install k6
```

### Problem: "Monolith not responding"
**Solution:**
```bash
docker-compose up -d
docker ps  # Verify containers running
```

### Problem: "Microservices not responding"
**Solution:**
- Check AWS EC2 instance is running
- Test: http://54.196.182.219/health
- If down, restart on EC2: `docker-compose restart`

### Problem: "Python module not found"
**Solution:**
```bash
pip install matplotlib numpy
```

### Problem: "No result files found"
**Solution:**
- Run tests first: `.\run-comparison-tests.ps1`
- Results must exist before running analysis

---

## Advanced: Custom Test Scenarios

### Test with Different User Loads

Edit `test-scenarios.js` and modify the scenarios object:

```javascript
export const scenarios = {
  custom_test: {
    executor: 'constant-vus',
    vus: 100,  // 100 concurrent users
    duration: '5m',  // 5 minutes
  },
};
```

Then run:
```powershell
$env:SCENARIO = "custom_test"
& "C:\Program Files\k6\k6.exe" run test-scenarios.js
```

---

## Performance Metrics Explained

### Response Time Metrics:

- **Average:** Mean response time (can be skewed by outliers)
- **Median (p50):** Middle value (better representation of typical performance)
- **95th Percentile (p95):** 95% of requests faster than this (industry standard)
- **99th Percentile (p99):** 99% of requests faster than this (tail latency)
- **Max:** Slowest request (can indicate problems)

### Throughput:

- **Requests/second:** How many requests the system handles
- **Higher is better**
- Limited by CPU, network, or database

### Error Rate:

- **Percentage of failed requests**
- **Lower is better**
- Should be < 1% for production systems

---

## Timeline

**Complete Testing Process:**

```
1. Start local monolith          → 1 min
2. Run all tests                 → 15-20 min
3. Analyze results               → 1 min
4. Review HTML report            → 5 min
5. Copy graphs to thesis         → 2 min
─────────────────────────────────────────
Total: ~25 minutes
```

---

## What to Report in Thesis

### Key Findings to Include:

1. **Response Time:**
   - "Microservices showed X% higher latency"
   - "Due to network overhead and cloud infrastructure"

2. **Throughput:**
   - "Monolith handled X req/s vs Y req/s for microservices"
   - "Local deployment advantage"

3. **Scalability:**
   - "Both architectures maintained < 1% error rate"
   - "Microservices offer better horizontal scaling potential"

4. **Trade-offs:**
   - "Performance cost for distributed architecture benefits"
   - "Acceptable overhead for production-scale applications"

### Sample Thesis Statement:

> "Performance testing revealed that the microservices architecture exhibited
> 2.5-5x higher average response times (150-350ms) compared to the monolithic
> implementation (40-80ms) under loads of 5-50 concurrent users. This overhead
> is primarily attributed to HTTP serialization, network latency to AWS (50-100ms),
> and Nginx gateway routing. However, the microservices architecture provides
> benefits in service isolation, independent scaling, and deployment flexibility
> that justify this performance trade-off for large-scale production systems."

---

## Summary

✅ **Run Tests:** `.\run-comparison-tests.ps1`
✅ **Analyze:** `python analyze-results.py`
✅ **View Report:** Open `comparison-report.html`
✅ **Use Graphs:** Copy to thesis
✅ **Include Code:** Add `analyze-results.py` to appendix

**You now have everything needed for your thesis performance analysis!** 🎓
