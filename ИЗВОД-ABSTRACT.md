# ИЗВОД И ABSTRACT

## ИЗВОД (Српски - Ћирилица)

Овај рад представља компаративну анализу перформанси монолитне и микросервисне архитектуре на примеру веб апликације КвизХаб. Истраживање је спроведено имплементацијом исте апликације у обе архитектуре и систематским мерењем перформанси коришћењем K6 load testing алата. Монолитна верзија deployована је локално коришћењем Docker Compose-а, док је микросервисна верзија deployована на AWS облаку са три независна сервиса (AuthService, QuizService, ExecutionService).

Спроведено је шест тестова који симулирају различите нивое оптерећења (5, 20 и 50 конкурентних корисника), при чему су мерене кључне метрике: време одзива, пропусност система и стопа грешака. Резултати показују да монолитна архитектура има значајно боље време одзива (4-6ms) у поређењу са микросервисном архитектуром (127-130ms), што представља разлику од 23-27 пута. Међутим, анализа је показала да је мрежна латенција доминантан фактор (90%+ утицаја), док архитектурни overhead микросервиса износи 3-4 пута под једнаким условима. Пропусност система је слична за обе архитектуре (~10% разлике).

Рад доприноси емпиријском разумевању перформансних карактеристика обе архитектуре и пружа препоруке за избор архитектуре на основу специфичних захтева пројекта. Налази потврђују да монолитна архитектура нуди супериорне перформансе за мале до средње апликације, док микросервисна архитектура доноси предности у скалабилности и флексибилности за веће и сложеније системе.

**Кључне речи:** микросервисна архитектура, монолитна архитектура, поређење перформанси, тестирање оптерећења, мрежна латенција, AWS, ASP.NET Core

---

## ABSTRACT (English)

This thesis presents a comparative performance analysis of monolithic and microservices architectures using the QuizHub web application as a case study. The research was conducted by implementing the same application in both architectures and systematically measuring performance using the K6 load testing tool. The monolithic version was deployed locally using Docker Compose, while the microservices version was deployed on AWS cloud with three independent services (AuthService, QuizService, ExecutionService).

Six tests were conducted simulating different load levels (5, 20, and 50 concurrent users), measuring key metrics: response time, system throughput, and error rate. Results show that the monolithic architecture has significantly better response time (4-6ms) compared to the microservices architecture (127-130ms), representing a 23-27x difference. However, analysis revealed that network latency is the dominant factor (90%+ impact), while the architectural overhead of microservices is 3-4x under equal conditions. System throughput is similar for both architectures (~10% difference).

The thesis contributes to empirical understanding of performance characteristics of both architectures and provides recommendations for architecture selection based on specific project requirements. Findings confirm that monolithic architecture offers superior performance for small to medium applications, while microservices architecture brings advantages in scalability and flexibility for larger and more complex systems.

**Keywords:** microservices architecture, monolithic architecture, performance comparison, load testing, network latency, AWS, ASP.NET Core

---

## НАПОМЕНЕ ЗА ФОРМАТИРАЊЕ:

1. **Извод** треба да буде **1 страница** (максимум 250-300 речи)
2. **Abstract** треба да буде **1 страница** (максимум 250-300 речи)
3. Обично се налазе на **почетку рада**, после насловне стране
4. Користи фонт **Times New Roman 12pt**, размак **1.5**
5. Кључне речи: **5-7 речи/фраза**

---

---

## СУПЕРКРАТКИ ИЗВОД (3 реченице):

### ИЗВОД (Српски)

Овај рад упоређује перформансе монолитне и микросервисне архитектуре на примеру веб апликације КвизХаб deployоване локално (монолит) и на AWS-у (три микросервиса). Резултати шест load тестова показују 23-27x разлику у времену одзива у корист монолита (4-6ms vs 127-130ms), при чему је мрежна латенција идентификована као доминантан фактор (90%+ утицаја). Рад пружа емпиријске податке и препоруке за избор архитектуре на основу специфичних захтева пројекта.

**Кључне речи:** микросервисна архитектура, монолитна архитектура, поређење перформанси, мрежна латенција, AWS

### ABSTRACT (English)

This thesis compares the performance of monolithic and microservices architectures using the QuizHub web application deployed locally (monolith) and on AWS (three microservices). Results from six load tests show a 23-27x response time difference favoring the monolith (4-6ms vs 127-130ms), with network latency identified as the dominant factor (90%+ impact). The thesis provides empirical data and recommendations for architecture selection based on specific project requirements.

**Keywords:** microservices architecture, monolithic architecture, performance comparison, network latency, AWS
