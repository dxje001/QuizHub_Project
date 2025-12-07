import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users over 30s
    { duration: '1m', target: 10 },   // Stay at 10 users for 1 minute
    { duration: '30s', target: 20 },  // Ramp up to 20 users over 30s
    { duration: '1m', target: 20 },   // Stay at 20 users for 1 minute
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // 95% of requests should be below 2s
    'errors': ['rate<0.1'],              // Error rate should be below 10%
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  // Test 1: Get all quizzes
  let response = http.get(`${BASE_URL}/api/quiz`);

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response has data': (r) => r.json().data !== undefined,
  }) || errorRate.add(1);

  responseTime.add(response.timings.duration);
  sleep(1);

  // Test 2: Get quiz categories
  response = http.get(`${BASE_URL}/api/quiz/categories`);

  check(response, {
    'categories status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  responseTime.add(response.timings.duration);
  sleep(1);

  // Test 3: Health check
  response = http.get(`${BASE_URL}/health`);

  check(response, {
    'health check responds': (r) => r.status === 200 || r.status === 404,
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'monolith-results.json': JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += indent + '========================================\n';
  summary += indent + 'MONOLITH PERFORMANCE TEST RESULTS\n';
  summary += indent + '========================================\n\n';

  summary += indent + `Test Duration: ${data.state.testRunDurationMs / 1000}s\n`;
  summary += indent + `Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `Requests/sec: ${data.metrics.http_reqs.values.rate.toFixed(2)}\n\n`;

  summary += indent + 'Response Times:\n';
  summary += indent + `  Average: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `  Median: ${data.metrics.http_req_duration.values.med.toFixed(2)}ms\n`;
  summary += indent + `  95th Percentile: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  99th Percentile: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += indent + `  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n\n`;

  summary += indent + 'HTTP Status:\n';
  summary += indent + `  Success Rate: ${((1 - (data.metrics.errors?.values.rate || 0)) * 100).toFixed(2)}%\n`;
  summary += indent + `  Failed Requests: ${data.metrics.http_req_failed?.values.passes || 0}\n\n`;

  summary += indent + '========================================\n';

  return summary;
}
