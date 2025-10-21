# Architecture Comparison: Monolith vs Microservices

## Visual Comparison

### Current Monolith Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CloudFront (CDN)                            │
│                  Static Assets Cached                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  S3 Bucket                                   │
│                  React Frontend                              │
│                  (HTML, JS, CSS)                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EC2 t2.micro (1 vCPU, 1 GB RAM)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         ASP.NET Core Monolith                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  AuthController                                   │  │ │
│  │  │  - Login, Register, Profile                      │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  QuizController                                   │  │ │
│  │  │  - CRUD, Categories, Questions                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Execution Logic                                  │  │ │
│  │  │  - Take Quiz, Submit, Score                      │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Leaderboard Logic                                │  │ │
│  │  │  - Rankings, Statistics                          │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  All in ONE process, ONE codebase                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Database Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         RDS PostgreSQL db.t2.micro (1 vCPU, 1 GB RAM)       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Single Database: kvizhub                              │ │
│  │  ┌──────────────┬──────────┬──────────┬──────────────┐ │ │
│  │  │ Users        │ Quizzes  │ Attempts │ Leaderboard  │ │ │
│  │  │ Questions    │ Answers  │ Results  │ Categories   │ │ │
│  │  └──────────────┴──────────┴──────────┴──────────────┘ │ │
│  │                                                          │ │
│  │  All tables in ONE database                             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Characteristics:**
- ✅ Simple architecture
- ✅ Fast communication (in-process)
- ✅ Easy to deploy (one container)
- ✅ ACID transactions across all data
- ❌ Scales as one unit (inefficient)
- ❌ Single point of failure
- ❌ Tight coupling

---

### Proposed Microservices Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  CloudFront (CDN)                            │
│                  Static Assets Cached                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  S3 Bucket                                   │
│                  React Frontend                              │
│                  (Same as monolith)                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Calls
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EC2 t2.micro (1 vCPU, 1 GB RAM)                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Nginx (API Gateway / Reverse Proxy)                   │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  Routing Rules:                                   │  │ │
│  │  │  /api/auth/* → Auth Service                      │  │ │
│  │  │  /api/quiz/* → Quiz Service                      │  │ │
│  │  │  /api/execution/* → Execution Service            │  │ │
│  │  │  /api/leaderboard/* → Leaderboard Service        │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│           │              │              │              │     │
│    ┌──────┴───┬──────────┴──┬───────────┴───┬──────────┴──┐ │
│    ▼          ▼             ▼               ▼             │ │
│  ┌─────┐  ┌─────┐       ┌─────┐         ┌─────┐          │ │
│  │Auth │  │Quiz │       │Exec │         │Lead │          │ │
│  │Svc  │  │Svc  │       │Svc  │         │Svc  │          │ │
│  │:5001│  │:5002│       │:5003│         │:5004│          │ │
│  └─────┘  └─────┘       └─────┘         └─────┘          │ │
│  200MB    250MB         250MB           200MB            │ │
│                                                            │ │
│  Each service is a separate Docker container              │ │
│  Independent processes, communicate via HTTP               │ │
└─────────────────────────────────────────────────────────────┘
         │          │              │               │
         ▼          ▼              ▼               ▼
┌────────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐
│  RDS PG    │ │ RDS PG  │ │  RDS PG     │ │  DynamoDB   │
│  auth_db   │ │ quiz_db │ │ results_db  │ │ (NoSQL)     │
│            │ │         │ │             │ │             │
│ Users      │ │ Quizzes │ │ Attempts    │ │ Leaderboard │
│ Profiles   │ │ Qs & As │ │ Results     │ │ Cache       │
│            │ │ Category│ │             │ │             │
└────────────┘ └─────────┘ └─────────────┘ └─────────────┘

    ▲                                               ▲
    │                                               │
    │         ┌──────────────────────────────────┐  │
    │         │     SQS Message Queue            │  │
    │         │  (Async quiz scoring events)     │  │
    └─────────┴──────────────────────────────────┴──┘
```

**Characteristics:**
- ✅ Independent scaling per service
- ✅ Fault isolation (one service fails, others continue)
- ✅ Independent deployments
- ✅ Technology flexibility
- ❌ Network overhead (HTTP calls)
- ❌ Distributed transactions complexity
- ❌ More operational complexity

---

## Request Flow Comparison

### Monolith: User Takes a Quiz

```
1. Browser → CloudFront → S3
   GET index.html
   ← React App

2. Browser → EC2 Monolith
   POST /api/auth/login {email, password}
   │
   ├─> AuthController.Login()
   │   └─> UserService.Authenticate()
   │       └─> Database Query (Users table)
   │           ← User data
   ├─> Generate JWT token
   ← {token: "eyJhb..."}

3. Browser → EC2 Monolith
   GET /api/quiz/1
   │
   ├─> QuizController.GetQuiz(1)
   │   └─> QuizService.GetById(1)
   │       └─> Database Query (Quizzes, Questions, Answers)
   │           ← Quiz data
   ← {quiz: {...}}

4. Browser → EC2 Monolith
   POST /api/quiz/1/submit {answers: [...]}
   │
   ├─> QuizController.Submit()
   │   └─> BEGIN TRANSACTION
   │       ├─> ExecutionService.CalculateScore()
   │       │   └─> Database Query (Answers)
   │       ├─> Save attempt (Attempts table)
   │       ├─> Save user answers (UserAnswers table)
   │       └─> Update leaderboard (Leaderboard table)
   │   └─> COMMIT TRANSACTION
   ← {score: 85, percentage: 85%}

Total time: ~200ms
- All in-process (no network overhead)
- Single database transaction (ACID)
- Fast but scales vertically only
```

### Microservices: User Takes a Quiz

```
1. Browser → CloudFront → S3
   GET index.html
   ← React App

2. Browser → EC2 (Nginx)
   POST /api/auth/login {email, password}
   │
   ├─> Nginx routes to Auth Service
   │   │
   │   └─> Auth Service (HTTP call, ~5ms overhead)
   │       ├─> AuthController.Login()
   │       │   └─> UserService.Authenticate()
   │       │       └─> Database Query (auth_db.Users)
   │       │           ← User data
   │       ├─> Generate JWT token
   │       ← {token: "eyJhb..."}
   │
   ← {token: "eyJhb..."}

3. Browser → EC2 (Nginx)
   GET /api/quiz/1
   │
   ├─> Nginx routes to Quiz Service
   │   │
   │   └─> Quiz Service (HTTP call, ~5ms overhead)
   │       ├─> Verify JWT (call Auth Service, ~10ms)
   │       ├─> QuizController.GetQuiz(1)
   │       │   └─> QuizService.GetById(1)
   │       │       └─> Database Query (quiz_db.Quizzes, Questions, Answers)
   │       │           ← Quiz data
   │       ← {quiz: {...}}
   │
   ← {quiz: {...}}

4. Browser → EC2 (Nginx)
   POST /api/execution/quiz/1/submit {answers: [...]}
   │
   ├─> Nginx routes to Execution Service
   │   │
   │   └─> Execution Service (HTTP call, ~5ms overhead)
   │       ├─> Verify JWT (call Auth Service, ~10ms)
   │       ├─> Get quiz data (call Quiz Service, ~20ms)
   │       ├─> ExecutionController.Submit()
   │       │   └─> ExecutionService.CalculateScore()
   │       │       └─> Database Query (quiz_db.Answers)
   │       │       └─> Save attempt (results_db.Attempts)
   │       │       └─> Publish to SQS (async, ~15ms)
   │       │           │
   │       │           └─> [Background] Leaderboard Service
   │       │               └─> Update DynamoDB leaderboard
   │       ← {score: 85, percentage: 85%}
   │
   ← {score: 85, percentage: 85%}

Total time: ~280ms
- Multiple network hops (+80ms overhead)
- Eventual consistency (leaderboard updates async)
- Slower but scales horizontally
```

**Performance Impact:**
- Monolith: ~200ms (faster due to in-process calls)
- Microservices: ~280ms (+40% slower due to network overhead)

**But at scale (>1000 concurrent users):**
- Monolith: CPU bottleneck, can't scale specific components
- Microservices: Scale Execution Service independently

---

## Failure Scenarios

### Monolith: Database Connection Fails

```
┌─────────┐
│ Browser │
└────┬────┘
     │ GET /api/quiz
     ▼
┌─────────────────┐
│  EC2 Monolith   │
│  ┌───────────┐  │
│  │ Quiz Ctrl │  │
│  └─────┬─────┘  │
│        │        │
│        ▼        │
│  ┌───────────┐  │
│  │ Database  │──┼──X  Connection failed!
│  │   Query   │  │
│  └───────────┘  │
└─────────────────┘
     │
     ▼
   ❌ Error: Database unavailable
   Entire application down!

Impact: 100% of features unavailable
```

### Microservices: Auth Service Fails

```
┌─────────┐
│ Browser │
└────┬────┘
     │ GET /api/quiz
     ▼
┌───────────────────────────────────┐
│  EC2                              │
│  ┌────────┐                       │
│  │ Nginx  │                       │
│  └───┬────┘                       │
│      │                            │
│      ▼                            │
│  ┌──────────────┐                 │
│  │ Quiz Service │                 │
│  │ ┌──────────┐ │                 │
│  │ │ Check    │ │                 │
│  │ │ Auth     │─┼────┐            │
│  │ └──────────┘ │    │            │
│  └──────────────┘    │            │
│                      ▼            │
│              ┌──────────────┐     │
│              │ Auth Service │──X  Service down!
│              └──────────────┘     │
└───────────────────────────────────┘
     │
     │ Option 1: Fail request ❌
     │ Option 2: Use cached auth ✅ (Circuit breaker)
     │ Option 3: Return anonymous data ✅
     ▼
   ⚠️ Partial functionality
   Public quizzes still accessible!
   Leaderboard still works!

Impact: ~30% of features unavailable
       70% still functional
```

---

## Cost Analysis (AWS Free Tier)

### Monolith Monthly Costs

```
┌──────────────────────────────────────────────────────────┐
│ Resource                 │ Usage      │ Cost             │
├──────────────────────────────────────────────────────────┤
│ EC2 t2.micro             │ 750 hrs    │ $0 (free tier)   │
│ RDS db.t2.micro          │ 750 hrs    │ $0 (free tier)   │
│ RDS Storage              │ 20 GB      │ $0 (free tier)   │
│ S3 Storage               │ 2 GB       │ $0 (free tier)   │
│ CloudFront               │ 50 GB/mo   │ $0 (free tier)   │
│ Data Transfer Out        │ 10 GB/mo   │ $0 (free tier)   │
├──────────────────────────────────────────────────────────┤
│ TOTAL (First 12 months)  │            │ $0.00/month      │
│ TOTAL (After 12 months)  │            │ ~$25-30/month    │
└──────────────────────────────────────────────────────────┘
```

### Microservices Monthly Costs

```
┌──────────────────────────────────────────────────────────┐
│ Resource                 │ Usage      │ Cost             │
├──────────────────────────────────────────────────────────┤
│ EC2 t2.micro (services)  │ 750 hrs    │ $0 (free tier)   │
│ RDS db.t2.micro          │ 750 hrs    │ $0 (free tier)   │
│ RDS Storage              │ 20 GB      │ $0 (free tier)   │
│ DynamoDB                 │ 5 GB       │ $0 (free tier)   │
│ SQS Requests             │ 100K/mo    │ $0 (free tier)   │
│ S3 Storage               │ 2 GB       │ $0 (free tier)   │
│ CloudFront               │ 50 GB/mo   │ $0 (free tier)   │
│ Data Transfer Out        │ 15 GB/mo   │ $0 (free tier)   │
├──────────────────────────────────────────────────────────┤
│ TOTAL (First 12 months)  │            │ $0.00/month      │
│ TOTAL (After 12 months)  │            │ ~$35-45/month    │
└──────────────────────────────────────────────────────────┘
```

**Verdict:** Both architectures fit completely within AWS Free Tier for the first year. Microservices cost ~30% more after free tier expires.

---

## When to Choose Each Architecture

### Choose Monolith When:

| Criteria | Threshold |
|----------|-----------|
| **Team Size** | 1-5 developers |
| **Concurrent Users** | < 1,000 users |
| **Request Rate** | < 100 requests/sec |
| **Deployment Frequency** | Weekly or less |
| **Operational Expertise** | Limited DevOps experience |
| **Budget** | Tight constraints |
| **Time to Market** | Need to ship fast |

**Example:** QuizHub (university project, <100 users, small team)

### Choose Microservices When:

| Criteria | Threshold |
|----------|-----------|
| **Team Size** | 5+ developers |
| **Concurrent Users** | > 1,000 users |
| **Request Rate** | > 100 requests/sec |
| **Scaling Requirements** | Components scale differently |
| **Deployment Frequency** | Daily or continuous |
| **Fault Tolerance** | Critical (e.g., payment systems) |
| **Technology Flexibility** | Need different languages/frameworks |

**Example:** Netflix, Uber, Amazon (millions of users, large teams)

---

## Summary Table

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| **Latency** | ✅ 200ms avg | ❌ 280ms avg (+40%) |
| **Throughput** | ✅ 30 req/s | ❌ 25 req/s (-17%) |
| **Scalability** | ❌ Vertical only | ✅ Horizontal per service |
| **Fault Isolation** | ❌ Single point of failure | ✅ Services fail independently |
| **Deployment** | ✅ Simple (one deploy) | ❌ Complex (4 deploys) |
| **Debugging** | ✅ Easy (one log) | ❌ Distributed tracing needed |
| **Cost (free tier)** | ✅ $0/month | ✅ $0/month |
| **Cost (production)** | ✅ $25/month | ❌ $40/month (+60%) |
| **Development Speed** | ✅ Fast (shared codebase) | ❌ Slower (coordination) |
| **Testing** | ✅ Simple integration tests | ❌ Contract testing required |
| **Data Consistency** | ✅ ACID transactions | ❌ Eventual consistency |

**For QuizHub:** Monolith wins 7-5, but microservices teach valuable cloud skills.

---

## Recommendation

### For Production (Real QuizHub)
**Use Monolith** because:
- Current scale doesn't justify microservices complexity
- Faster performance at this scale
- Lower operational overhead
- Easier for small team to maintain

### For University Project
**Implement Both** because:
- ✅ Demonstrates understanding of both architectures
- ✅ Shows ability to compare and analyze trade-offs
- ✅ Proves cloud deployment skills (AWS)
- ✅ Real performance data for thesis
- ✅ Impresses professors with modern architecture knowledge

**Best of both worlds:** Keep monolith running, extract just Auth service to demonstrate microservices concept without over-engineering.

---

## Next Steps

1. Read [FAST_TRACK_GUIDE.md](FAST_TRACK_GUIDE.md)
2. Decide: Full microservices or simplified (Auth + Monolith)?
3. Follow Day 1 → Day 2 → Day 3 plan
4. Run performance tests
5. Document findings for thesis

Good luck! 🚀
