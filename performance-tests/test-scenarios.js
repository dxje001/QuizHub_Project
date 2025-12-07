// Performance Test Scenarios - Comparing User Loads
// This file contains different test scenarios for comprehensive comparison

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const successfulRequests = new Counter('successful_requests');
const failedRequests = new Counter('failed_requests');

// Get base URL from environment (set when running tests)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TEST_NAME = __ENV.TEST_NAME || 'unknown';

// Test scenario configurations
export const scenarios = {
  // Scenario 1: Light Load (5 users)
  light_load: {
    executor: 'constant-vus',
    vus: 5,
    duration: '2m',
  },

  // Scenario 2: Medium Load (20 users)
  medium_load: {
    executor: 'constant-vus',
    vus: 20,
    duration: '2m',
  },

  // Scenario 3: Heavy Load (50 users)
  heavy_load: {
    executor: 'constant-vus',
    vus: 50,
    duration: '2m',
  },

  // Scenario 4: Stress Test (ramping up)
  stress_test: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 10 },
      { duration: '1m', target: 20 },
      { duration: '1m', target: 30 },
      { duration: '1m', target: 40 },
      { duration: '1m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
};

// Thresholds for pass/fail criteria
export const options = {
  scenarios: {
    default: scenarios[__ENV.SCENARIO || 'medium_load'],
  },
  thresholds: {
    'http_req_duration': ['p(95)<3000', 'p(99)<5000'], // Calculate p99 explicitly
    'http_req_failed': ['rate<0.1'],     // Less than 10% errors
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
};

// Realistic user behavior - browse, view quiz, take quiz
export default function () {
  // 1. Browse quizzes
  let response = http.get(`${BASE_URL}/api/quiz`, {
    tags: { name: 'browse_quizzes' },
  });

  const browseSuccess = check(response, {
    'browse quizzes status is 200': (r) => r.status === 200,
    'browse quizzes has data': (r) => {
      try {
        const json = r.json();
        return json.data !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (browseSuccess) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }

  responseTime.add(response.timings.duration);
  sleep(1);

  // 2. Get categories
  response = http.get(`${BASE_URL}/api/category`, {
    tags: { name: 'get_categories' },
  });

  const categoriesSuccess = check(response, {
    'categories status is 200': (r) => r.status === 200,
  });

  if (categoriesSuccess) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }

  responseTime.add(response.timings.duration);
  sleep(1);

  // 3. View specific quiz details (simulate clicking on a quiz)
  // Using real quiz ID from the database
  const quizIds = [
    '1f645276-d6bc-4901-8774-5d8af1e13396', // proba quiz (Sports)
  ];

  const randomQuizId = quizIds[Math.floor(Math.random() * quizIds.length)];

  response = http.get(`${BASE_URL}/api/quiz/${randomQuizId}`, {
    tags: { name: 'view_quiz_details' },
  });

  const detailsSuccess = check(response, {
    'quiz details status is 200': (r) => r.status === 200,
  });

  if (detailsSuccess) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }

  responseTime.add(response.timings.duration);
  sleep(2);

  // 4. Health check (lightweight request)
  response = http.get(`${BASE_URL}/health`, {
    tags: { name: 'health_check' },
  });

  const healthSuccess = check(response, {
    'health check responds': (r) => r.status === 200 || r.status === 404,
  });

  if (healthSuccess) {
    successfulRequests.add(1);
  } else {
    failedRequests.add(1);
    errorRate.add(1);
  }

  sleep(1);
}

// Summary function - formats output nicely
export function handleSummary(data) {
  const timestamp = new Date().toISOString();

  return {
    [`results-${TEST_NAME}-${__ENV.SCENARIO || 'default'}.json`]: JSON.stringify({
      ...data,
      testConfig: {
        baseUrl: BASE_URL,
        testName: TEST_NAME,
        scenario: __ENV.SCENARIO || 'medium_load',
        timestamp: timestamp,
      },
    }, null, 2),
    'stdout': generateTextSummary(data),
  };
}

function generateTextSummary(data) {
  const indent = '  ';
  let summary = '\n';
  summary += indent + '========================================\n';
  summary += indent + `${TEST_NAME.toUpperCase()} - ${__ENV.SCENARIO || 'default'}\n`;
  summary += indent + '========================================\n\n';

  summary += indent + `Test Duration: ${(data.state.testRunDurationMs / 1000).toFixed(2)}s\n`;
  summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}\n`;
  summary += indent + `Successful: ${data.metrics.successful_requests?.values.count || 0}\n`;
  summary += indent + `Failed: ${data.metrics.failed_requests?.values.count || 0}\n\n`;

  summary += indent + 'Response Times:\n';
  summary += indent + `  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `  Median: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
  summary += indent + `  Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
  summary += indent + `  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  summary += indent + `  95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  99th Percentile: ${(data.metrics.http_req_duration.values['p(99)'] || 0).toFixed(2)}ms\n\n`;

  summary += indent + 'HTTP Status:\n';
  const errorRateValue = data.metrics.errors?.values.rate || 0;
  summary += indent + `  Success Rate: ${((1 - errorRateValue) * 100).toFixed(2)}%\n`;
  summary += indent + `  Error Rate: ${(errorRateValue * 100).toFixed(2)}%\n\n`;

  summary += indent + 'Data Transfer:\n';
  summary += indent + `  Received: ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB\n`;
  summary += indent + `  Sent: ${(data.metrics.data_sent.values.count / 1024).toFixed(2)} KB\n\n`;

  summary += indent + '========================================\n';

  return summary;
}
