#!/usr/bin/env node

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4000';
const CONCURRENT_REQUESTS = 10;
const TOTAL_REQUESTS = 100;
const DELAY_BETWEEN_REQUESTS = 100; // ms

// Test scenarios
const testScenarios = [
  {
    name: 'Dashboard Stats',
    endpoint: '/api/dashboard/stats',
    method: 'GET',
    requiresAuth: true,
  },
  {
    name: 'Customers List',
    endpoint: '/api/customers',
    method: 'GET',
    requiresAuth: true,
  },
  {
    name: 'Tasks List',
    endpoint: '/api/tasks',
    method: 'GET',
    requiresAuth: true,
  },
  {
    name: 'Leads List',
    endpoint: '/api/leads',
    method: 'GET',
    requiresAuth: true,
  },
  {
    name: 'Health Check',
    endpoint: '/api/health',
    method: 'GET',
    requiresAuth: false,
  },
];

// Performance metrics
class PerformanceMetrics {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  addResult(scenario, responseTime, statusCode, success) {
    this.results.push({
      scenario,
      responseTime,
      statusCode,
      success,
      timestamp: new Date(),
    });
  }

  addError(scenario, error) {
    this.errors.push({
      scenario,
      error: error.message,
      timestamp: new Date(),
    });
  }

  getStats() {
    if (this.results.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
      };
    }

    const successful = this.results.filter(r => r.success);
    const failed = this.results.filter(r => !r.success);
    const responseTimes = successful.map(r => r.responseTime).sort((a, b) => a - b);

    return {
      totalRequests: this.results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      errorRate: (failed.length / this.results.length) * 100,
    };
  }

  getScenarioStats(scenarioName) {
    const scenarioResults = this.results.filter(r => r.scenario === scenarioName);
    if (scenarioResults.length === 0) return null;

    const successful = scenarioResults.filter(r => r.success);
    const responseTimes = successful.map(r => r.responseTime).sort((a, b) => a - b);

    return {
      scenario: scenarioName,
      totalRequests: scenarioResults.length,
      successfulRequests: successful.length,
      averageResponseTime: Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
    };
  }

  printReport() {
    console.log('\n=== PERFORMANCE TEST REPORT ===\n');
    
    const stats = this.getStats();
    console.log('Overall Statistics:');
    console.log(`  Total Requests: ${stats.totalRequests}`);
    console.log(`  Successful: ${stats.successfulRequests}`);
    console.log(`  Failed: ${stats.failedRequests}`);
    console.log(`  Error Rate: ${stats.errorRate.toFixed(2)}%`);
    console.log(`  Average Response Time: ${stats.averageResponseTime}ms`);
    console.log(`  Min Response Time: ${stats.minResponseTime}ms`);
    console.log(`  Max Response Time: ${stats.maxResponseTime}ms`);
    console.log(`  95th Percentile: ${stats.p95ResponseTime}ms`);
    console.log(`  99th Percentile: ${stats.p99ResponseTime}ms`);

    console.log('\nPer-Scenario Statistics:');
    testScenarios.forEach(scenario => {
      const scenarioStats = this.getScenarioStats(scenario.name);
      if (scenarioStats) {
        console.log(`\n  ${scenario.name}:`);
        console.log(`    Total Requests: ${scenarioStats.totalRequests}`);
        console.log(`    Successful: ${scenarioStats.successfulRequests}`);
        console.log(`    Average Response Time: ${scenarioStats.averageResponseTime}ms`);
        console.log(`    Min Response Time: ${scenarioStats.minResponseTime}ms`);
        console.log(`    Max Response Time: ${scenarioStats.maxResponseTime}ms`);
        console.log(`    95th Percentile: ${scenarioStats.p95ResponseTime}ms`);
      }
    });

    if (this.errors.length > 0) {
      console.log('\nErrors:');
      this.errors.forEach(error => {
        console.log(`  ${error.scenario}: ${error.error}`);
      });
    }
  }
}

// Authentication helper
async function getAuthToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
    });
    return response.data.data.accessToken;
  } catch (error) {
    console.error('Failed to get auth token:', error.message);
    return null;
  }
}

// Single request test
async function testRequest(scenario, authToken, metrics) {
  const startTime = performance.now();
  
  try {
    const config = {
      method: scenario.method,
      url: `${BASE_URL}${scenario.endpoint}`,
      timeout: 10000,
    };

    if (scenario.requiresAuth && authToken) {
      config.headers = {
        Authorization: `Bearer ${authToken}`,
      };
    }

    const response = await axios(config);
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    metrics.addResult(scenario.name, responseTime, response.status, true);
    
    return {
      success: true,
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    metrics.addResult(scenario.name, responseTime, error.response?.status || 0, false);
    metrics.addError(scenario.name, error);

    return {
      success: false,
      responseTime,
      statusCode: error.response?.status || 0,
      error: error.message,
    };
  }
}

// Load test function
async function runLoadTest(scenario, authToken, metrics) {
  console.log(`Running load test for: ${scenario.name}`);
  
  const promises = [];
  
  for (let i = 0; i < TOTAL_REQUESTS; i++) {
    const promise = testRequest(scenario, authToken, metrics);
    promises.push(promise);
    
    // Add delay between requests to avoid overwhelming the server
    if (i < TOTAL_REQUESTS - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
    }
  }

  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`  Completed: ${results.length} requests`);
  console.log(`  Successful: ${successful.length}`);
  console.log(`  Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    const avgResponseTime = Math.round(
      successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length
    );
    console.log(`  Average Response Time: ${avgResponseTime}ms`);
  }
}

// Concurrent load test
async function runConcurrentLoadTest(scenario, authToken, metrics) {
  console.log(`Running concurrent load test for: ${scenario.name}`);
  
  const batchSize = CONCURRENT_REQUESTS;
  const batches = Math.ceil(TOTAL_REQUESTS / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - batch * CONCURRENT_REQUESTS);
    
    for (let i = 0; i < batchSize; i++) {
      batchPromises.push(testRequest(scenario, authToken, metrics));
    }
    
    const batchResults = await Promise.all(batchPromises);
    
    const successful = batchResults.filter(r => r.success);
    const failed = batchResults.filter(r => !r.success);
    
    console.log(`  Batch ${batch + 1}/${batches}: ${successful.length} successful, ${failed.length} failed`);
    
    // Add delay between batches
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Main test runner
async function runPerformanceTests() {
  console.log('Starting Performance Tests...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Requests per scenario: ${TOTAL_REQUESTS}`);
  console.log(`Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log('');

  const metrics = new PerformanceMetrics();
  
  // Get auth token
  const authToken = await getAuthToken();
  if (!authToken) {
    console.error('Failed to get authentication token. Some tests may fail.');
  }

  // Run tests for each scenario
  for (const scenario of testScenarios) {
    console.log(`\nTesting: ${scenario.name}`);
    console.log(`Endpoint: ${scenario.endpoint}`);
    
    // Run sequential load test
    await runLoadTest(scenario, authToken, metrics);
    
    // Run concurrent load test
    await runConcurrentLoadTest(scenario, authToken, metrics);
  }

  // Print final report
  metrics.printReport();
}

// Database performance test
async function runDatabasePerformanceTest() {
  console.log('\n=== DATABASE PERFORMANCE TEST ===\n');
  
  const authToken = await getAuthToken();
  if (!authToken) {
    console.error('Failed to get authentication token for database tests.');
    return;
  }

  const dbMetrics = new PerformanceMetrics();
  
  // Test different query patterns
  const dbTestScenarios = [
    {
      name: 'Customers with Pagination',
      endpoint: '/api/customers?page=1&limit=10',
    },
    {
      name: 'Customers with Search',
      endpoint: '/api/customers?search=test',
    },
    {
      name: 'Tasks with Filter',
      endpoint: '/api/tasks?completed=false',
    },
    {
      name: 'Dashboard Stats',
      endpoint: '/api/dashboard/stats',
    },
    {
      name: 'Lead Pipeline Stats',
      endpoint: '/api/reports/pipeline',
    },
  ];

  for (const scenario of dbTestScenarios) {
    console.log(`Testing: ${scenario.name}`);
    
    for (let i = 0; i < 20; i++) {
      await testRequest(scenario, authToken, dbMetrics);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n=== DATABASE PERFORMANCE RESULTS ===');
  dbMetrics.printReport();
}

// Memory leak test
async function runMemoryLeakTest() {
  console.log('\n=== MEMORY LEAK TEST ===\n');
  
  const authToken = await getAuthToken();
  if (!authToken) {
    console.error('Failed to get authentication token for memory leak test.');
    return;
  }

  const memoryMetrics = new PerformanceMetrics();
  const iterations = 50;
  
  console.log(`Running ${iterations} iterations to check for memory leaks...`);
  
  for (let i = 0; i < iterations; i++) {
    console.log(`Iteration ${i + 1}/${iterations}`);
    
    // Test multiple endpoints in sequence
    for (const scenario of testScenarios.slice(0, 3)) {
      await testRequest(scenario, authToken, memoryMetrics);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Log memory usage
    const memUsage = process.memoryUsage();
    console.log(`  Memory: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  }
  
  console.log('\n=== MEMORY LEAK TEST RESULTS ===');
  memoryMetrics.printReport();
}

// Run all tests
async function main() {
  try {
    await runPerformanceTests();
    await runDatabasePerformanceTest();
    await runMemoryLeakTest();
    
    console.log('\n=== PERFORMANCE TESTS COMPLETED ===');
  } catch (error) {
    console.error('Performance test failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runPerformanceTests,
  runDatabasePerformanceTest,
  runMemoryLeakTest,
  PerformanceMetrics,
};
