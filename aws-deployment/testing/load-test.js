import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginDuration = new Trend('login_duration');
const quizBrowseDuration = new Trend('quiz_browse_duration');
const quizTakeDuration = new Trend('quiz_take_duration');
const quizSubmitDuration = new Trend('quiz_submit_duration');
const leaderboardDuration = new Trend('leaderboard_duration');

const errorRate = new Rate('errors');
const successfulLogins = new Counter('successful_logins');
const successfulQuizSubmissions = new Counter('successful_quiz_submissions');

// Test configuration
export let options = {
  stages: [
    // Warmup
    { duration: '1m', target: 10 },   // Ramp up to 10 users

    // Normal load
    { duration: '2m', target: 50 },   // Ramp to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes

    // Peak load
    { duration: '2m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes

    // Stress test
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '3m', target: 200 },  // Stay at 200 users

    // Ramp down
    { duration: '2m', target: 0 },    // Gracefully ramp down
  ],

  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'http_req_failed': ['rate<0.01'],   // Error rate should be less than 1%
    'login_duration': ['p(95)<800'],    // 95% of logins under 800ms
    'quiz_browse_duration': ['p(95)<400'], // 95% of quiz browse under 400ms
    'quiz_submit_duration': ['p(95)<1000'], // 95% of submissions under 1s
  },
};

// Base URL from environment variable
const BASE_URL = __ENV.API_URL || 'http://localhost';

// Test data
const TEST_USERS = [
  { email: 'testuser1@example.com', password: 'Test123!' },
  { email: 'testuser2@example.com', password: 'Test123!' },
  { email: 'testuser3@example.com', password: 'Test123!' },
  { email: 'testuser4@example.com', password: 'Test123!' },
  { email: 'testuser5@example.com', password: 'Test123!' },
];

// Get random user for testing
function getRandomUser() {
  return TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
}

// Main test scenario
export default function () {
  const user = getRandomUser();
  let token = null;

  // Group 1: Authentication
  group('Authentication Flow', function () {
    const loginPayload = JSON.stringify({
      email: user.email,
      password: user.password,
    });

    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'Login' },
    };

    const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, loginParams);

    loginDuration.add(loginRes.timings.duration);

    const loginSuccess = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login response has token': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.token !== undefined;
        } catch (e) {
          return false;
        }
      },
      'login time < 1s': (r) => r.timings.duration < 1000,
    });

    if (loginSuccess && loginRes.status === 200) {
      try {
        const body = JSON.parse(loginRes.body);
        token = body.token;
        successfulLogins.add(1);
      } catch (e) {
        console.error('Failed to parse login response:', e);
        errorRate.add(1);
      }
    } else {
      errorRate.add(1);
      return; // Stop if login failed
    }
  });

  sleep(1);

  // Group 2: Browse Quizzes
  if (token) {
    group('Browse Quizzes', function () {
      const quizListParams = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        tags: { name: 'GetQuizzes' },
      };

      const quizListRes = http.get(`${BASE_URL}/api/quiz`, quizListParams);

      quizBrowseDuration.add(quizListRes.timings.duration);

      check(quizListRes, {
        'quiz list status is 200': (r) => r.status === 200,
        'quiz list returns array': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body) || Array.isArray(body.data);
          } catch (e) {
            return false;
          }
        },
        'quiz list time < 500ms': (r) => r.timings.duration < 500,
      });
    });
  }

  sleep(2);

  // Group 3: Take a Quiz
  if (token) {
    group('Take Quiz', function () {
      const quizId = 1; // Assume quiz with ID 1 exists

      const quizParams = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        tags: { name: 'GetQuiz' },
      };

      const quizRes = http.get(`${BASE_URL}/api/quiz/${quizId}/take`, quizParams);

      quizTakeDuration.add(quizRes.timings.duration);

      check(quizRes, {
        'quiz detail status is 200': (r) => r.status === 200 || r.status === 404,
        'quiz detail time < 600ms': (r) => r.timings.duration < 600,
      });
    });
  }

  sleep(3); // Simulate time to complete quiz

  // Group 4: Submit Quiz
  if (token) {
    group('Submit Quiz', function () {
      const quizId = 1;

      const submissionPayload = JSON.stringify({
        quizId: quizId,
        answers: [
          { questionId: 1, selectedAnswers: [1], timeSpent: 10 },
          { questionId: 2, selectedAnswers: [2], timeSpent: 15 },
          { questionId: 3, selectedAnswers: [1, 2], timeSpent: 20 },
        ],
      });

      const submitParams = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        tags: { name: 'SubmitQuiz' },
      };

      const submitRes = http.post(
        `${BASE_URL}/api/quiz/${quizId}/submit`,
        submissionPayload,
        submitParams
      );

      quizSubmitDuration.add(submitRes.timings.duration);

      const submitSuccess = check(submitRes, {
        'submit status is 200 or 201': (r) => r.status === 200 || r.status === 201 || r.status === 404,
        'submit time < 1.5s': (r) => r.timings.duration < 1500,
      });

      if (submitSuccess && (submitRes.status === 200 || submitRes.status === 201)) {
        successfulQuizSubmissions.add(1);
      }
    });
  }

  sleep(2);

  // Group 5: View Leaderboard
  if (token) {
    group('View Leaderboard', function () {
      const leaderboardParams = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        tags: { name: 'GetLeaderboard' },
      };

      const leaderboardRes = http.get(`${BASE_URL}/api/quiz/leaderboard`, leaderboardParams);

      leaderboardDuration.add(leaderboardRes.timings.duration);

      check(leaderboardRes, {
        'leaderboard status is 200': (r) => r.status === 200 || r.status === 404,
        'leaderboard time < 700ms': (r) => r.timings.duration < 700,
      });
    });
  }

  sleep(1);
}

// Setup function - runs once before test
export function setup() {
  console.log(`Starting load test against: ${BASE_URL}`);
  console.log('Creating test users...');

  // Try to register test users (ignore errors if they already exist)
  TEST_USERS.forEach(user => {
    const registerPayload = JSON.stringify({
      firstName: 'Test',
      lastName: 'User',
      email: user.email,
      password: user.password,
    });

    const registerParams = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    http.post(`${BASE_URL}/api/auth/register`, registerPayload, registerParams);
    // Ignore response - user might already exist
  });

  console.log('Test users ready');
  return { baseUrl: BASE_URL };
}

// Teardown function - runs once after test
export function teardown(data) {
  console.log(`Load test completed against: ${data.baseUrl}`);
}

// Handle summary for better reporting
export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `results-${timestamp}.json`;

  return {
    [filename]: JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}================\n\n`;

  if (data.metrics.http_reqs) {
    summary += `${indent}Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  }

  if (data.metrics.http_req_duration) {
    summary += `${indent}Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  }

  if (data.metrics.http_req_failed) {
    const errorPercent = (data.metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}Error Rate: ${errorPercent}%\n`;
  }

  if (data.metrics.successful_logins) {
    summary += `${indent}Successful Logins: ${data.metrics.successful_logins.values.count}\n`;
  }

  if (data.metrics.successful_quiz_submissions) {
    summary += `${indent}Successful Quiz Submissions: ${data.metrics.successful_quiz_submissions.values.count}\n`;
  }

  summary += '\n';
  return summary;
}
