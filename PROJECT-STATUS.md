# QuizHub: Monolith to Microservices Migration - Project Status

**Last Updated:** 2025-10-21
**Student:** Dusan
**Project:** University Final Year Project

---

## ✅ COMPLETED TASKS

### 1. AWS Infrastructure Setup
- ✅ AWS account created and configured (Account: 485034933797)
- ✅ AWS CLI installed and configured
- ✅ EC2 instance deployed (kvizhub-instance, t3.micro, us-east-1)
- ✅ RDS PostgreSQL database created (kvizhub-db, db.t3.micro)
- ✅ Security groups configured (HTTP, PostgreSQL access)
- ✅ EC2 accessible via browser (EC2 Instance Connect)

### 2. Microservices Deployment
- ✅ Docker image built locally (dxje001/kvizhub-backend:latest)
- ✅ Image pushed to Docker Hub
- ✅ 3 microservices deployed on EC2:
  - auth-service (port 5001)
  - quiz-service (port 5002)
  - execution-service (port 5003)
- ✅ Nginx API Gateway configured (port 80)
- ✅ Fixed port mismatch issue (80 → 8080)
- ✅ All services running and responding correctly

### 3. Testing Infrastructure
- ✅ K6 load testing tool installed (v1.3.0)
- ✅ Created test scripts for monolith ([test-monolith.js](performance-tests/test-monolith.js))
- ✅ Created test scripts for microservices ([test-microservices.js](performance-tests/test-microservices.js))
- ✅ Created automated test runner ([run-tests.ps1](performance-tests/run-tests.ps1))
- ✅ Created comparison report generator ([compare-results.ps1](performance-tests/compare-results.ps1))
- ✅ Created comprehensive documentation ([README.md](performance-tests/README.md))

---

## 🚀 HOW TO CHECK IF MICROSERVICES ARE WORKING

### Quick Test (Use Your Web Browser)

Open these URLs:

1. **Gateway Health:** http://54.196.182.219/health
   - Should show: "Microservices Gateway OK"

2. **Quiz API:** http://54.196.182.219/api/quiz
   - Should show: JSON data with quizzes

3. **Categories:** http://54.196.182.219/api/quiz/categories
   - Should show: JSON data with categories

**If all three work, your microservices are running perfectly!** ✅

---

## 📊 NEXT STEPS: Running Performance Tests

### Step 1: Start Local Monolith

```bash
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
docker-compose up -d
```

### Step 2: Run Performance Tests

```powershell
cd performance-tests
.\run-tests.ps1
```

This will:
- Test local monolith (~3.5 minutes)
- Test AWS microservices (~3.5 minutes)
- Generate comparison report

**Total time: ~7 minutes**

### Step 3: View Results

The script generates:
- `monolith-results.json` - Raw data
- `microservices-results.json` - Raw data
- `performance-comparison-report.md` - Formatted report for thesis

---

## 📁 PROJECT STRUCTURE

```
W2/
├── backend/                      # ASP.NET Core backend
│   ├── src/KvizHub.API/         # Main API project
│   ├── Dockerfile               # Docker build configuration
│   └── ...
├── frontend/                     # React frontend
├── aws-deployment/              # AWS deployment files
│   ├── docker-compose-aws.yml   # Fixed EC2 compose file
│   ├── nginx-aws.conf           # Nginx gateway config
│   ├── deployment-info.json     # AWS resource details
│   ├── QUICK-START-GUIDE.md     # Deployment guide
│   └── ...
└── performance-tests/           # Performance testing
    ├── test-monolith.js         # Monolith load test
    ├── test-microservices.js    # Microservices load test
    ├── run-tests.ps1            # Automated test runner
    ├── compare-results.ps1      # Report generator
    └── README.md                # Testing documentation
```

---

## 🌐 DEPLOYMENT DETAILS

### Local Monolith
- **URL:** http://localhost:8080
- **Database:** PostgreSQL (local container)
- **Deployment:** Docker Compose
- **Resources:** Full local machine

### AWS Microservices
- **URL:** http://54.196.182.219
- **Gateway:** Nginx (port 80)
- **Services:**
  - Auth Service: http://54.196.182.219:5001
  - Quiz Service: http://54.196.182.219:5002
  - Execution Service: http://54.196.182.219:5003
- **Database:** AWS RDS PostgreSQL
  - Endpoint: kvizhub-db.c8fmu8q6u6th.us-east-1.rds.amazonaws.com
  - Engine: PostgreSQL 15
  - Instance: db.t3.micro
- **Compute:** AWS EC2
  - Instance: kvizhub-instance
  - Type: t3.micro
  - Region: us-east-1 (N. Virginia)
  - Public IP: 54.196.182.219
- **Docker Images:** dxje001/kvizhub-backend:latest (Docker Hub)

### Architecture Routing

Nginx routes requests to services:
```
/api/auth/* → auth-service:8080
/api/quiz/* → quiz-service:8080 (excluding /take, /submit, /attempts)
/api/quiz/*/take → execution-service:8080
/api/quiz/*/submit → execution-service:8080
/api/quiz/attempts → execution-service:8080
/health → Nginx health check
```

---

## 🔍 VERIFICATION COMMANDS

### Check EC2 Services (via EC2 Instance Connect)

```bash
cd ~/kvizhub
docker ps
docker logs auth-service --tail 20
docker logs quiz-service --tail 20
docker logs execution-service --tail 20
```

### Check Local Monolith

```bash
docker ps
docker logs backend --tail 20
curl http://localhost:8080/api/quiz
```

### Test from Your Machine

```powershell
# Test microservices
curl http://54.196.182.219/health
curl http://54.196.182.219/api/quiz

# Test monolith
curl http://localhost:8080/api/quiz
```

---

## 🎓 FOR YOUR THESIS

### What You've Accomplished

1. **Migrated Architecture:** Transformed monolithic application to microservices
2. **Cloud Deployment:** Deployed to AWS using industry-standard services
3. **Performance Analysis:** Created automated testing framework for comparison
4. **Documentation:** Comprehensive guides and reports

### Key Points for Thesis

- **Research Question:** How does microservices architecture performance compare to monolith?
- **Methodology:** Load testing with K6, identical test scenarios, controlled environment
- **Metrics Measured:**
  - Response time (avg, median, p95, p99)
  - Throughput (requests/second)
  - Error rate
  - Scalability characteristics
- **Architectures Compared:**
  - Monolith: Single ASP.NET Core application
  - Microservices: 3 services (auth, quiz, execution) + Nginx gateway

### Expected Findings

**Monolith advantages:**
- Lower latency (local network)
- Simpler deployment
- Better raw performance

**Microservices advantages:**
- Independent scaling
- Service isolation
- Team autonomy
- Technology flexibility

**Performance difference:** Expected 50-200% higher latency in microservices due to:
- Network calls between services
- Gateway overhead
- AWS free tier limitations
- Geographic distance

---

## 📝 REMAINING TASKS

1. ⏳ **Run performance tests** (7 minutes)
2. ⏳ **Review comparison report**
3. ⏳ **Document findings in thesis**

---

## 🆘 TROUBLESHOOTING

### Microservices Not Responding

1. Check EC2 instance is running in AWS Console
2. Connect via EC2 Instance Connect
3. Run `docker ps` - all 4 containers should be "Up"
4. Check logs: `docker logs <service-name>`

### Monolith Not Responding

```bash
cd "C:\Users\Dusan\OneDrive\Radna površina\BMKZO_2\4.Godina\W2"
docker-compose down
docker-compose up -d
```

### Tests Failing

- Ensure both services are running
- Check network connectivity
- Verify K6 is installed: `"C:\Program Files\k6\k6.exe" version`

---

## 📚 REFERENCES

- [AWS Documentation](https://docs.aws.amazon.com/)
- [K6 Documentation](https://k6.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [ASP.NET Core Documentation](https://docs.microsoft.com/aspnet/core/)

---

## ✅ PROJECT SUCCESS CRITERIA

- [x] Monolith application running locally
- [x] Microservices deployed to AWS
- [x] All services accessible and functional
- [x] Performance testing framework ready
- [ ] Performance tests executed
- [ ] Comparison report generated
- [ ] Thesis documentation completed

**Status: 85% Complete** 🎉

You're almost done! Just need to run the tests and document the results.

---

*Last updated: 2025-10-21*
