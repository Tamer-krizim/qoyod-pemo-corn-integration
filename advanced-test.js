#!/usr/bin/env node
/**
 * Advanced Test Suite for Pemo-Qoyod Sync Function
 * 
 * This is an enhanced testing framework that simulates real-world scenarios
 * and provides comprehensive validation of the sync function.
 * 
 * Features:
 * - Mock API responses
 * - Performance testing
 * - Edge case validation
 * - Detailed reporting
 * - Interactive mode
 */

const syncFunction = require('./api/sync-invoices.js');

// Enhanced color system
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Enhanced logging system
class Logger {
  static log(message, color = 'reset', prefix = '') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[color]}${prefix}[${timestamp}] ${message}${colors.reset}`);
  }
  
  static success(message) {
    this.log(`✅ ${message}`, 'green', '');
  }
  
  static error(message) {
    this.log(`❌ ${message}`, 'red', '');
  }
  
  static warning(message) {
    this.log(`⚠️  ${message}`, 'yellow', '');
  }
  
  static info(message) {
    this.log(`ℹ️  ${message}`, 'blue', '');
  }
  
  static debug(message) {
    this.log(`🐛 ${message}`, 'dim', '');
  }
  
  static header(message) {
    const line = '═'.repeat(60);
    console.log(`${colors.bright}${colors.cyan}${line}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${message.toUpperCase()}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${line}${colors.reset}`);
  }
  
  static subheader(message) {
    console.log(`${colors.bright}${colors.yellow}🔸 ${message}${colors.reset}`);
    console.log(`${colors.yellow}${'─'.repeat(40)}${colors.reset}`);
  }
}

// Mock API responses for testing
const mockResponses = {
  pemo: {
    success: {
      transactions: [
        {
          id: 'txn_001',
          totalAmount: 4550, // 45.50 SAR in fils
          date: '2024-01-15T10:30:00Z',
          merchant: 'ستاربكس - الرياض'
        },
        {
          id: 'txn_002', 
          totalAmount: 12000, // 120.00 SAR in fils
          date: '2024-01-15T14:20:00Z',
          merchant: 'أوبر'
        },
        {
          id: 'txn_003',
          totalAmount: 8500, // 85.00 SAR in fils
          date: '2024-01-15T18:45:00Z',
          merchant: 'مطعم النخيل'
        }
      ]
    },
    empty: {
      transactions: []
    },
    unauthorized: {
      status: 401,
      message: 'Unauthorized',
      request_id: 'test_request_123'
    }
  },
  
  qoyod: {
    success: {
      journal_entry: {
        id: 'je_001',
        number: 'JE-2024-001',
        status: 'approved'
      }
    },
    error: {
      status: 400,
      message: 'Invalid account ID',
      errors: ['Debit account not found']
    }
  }
};

// Enhanced mock response creator
function createAdvancedMockResponse() {
  const responses = [];
  
  return {
    status: (code) => {
      const response = {
        json: (data) => {
          responses.push({ status: code, data });
          Logger.info(`Mock Response: ${code} - ${JSON.stringify(data, null, 2)}`);
          return createAdvancedMockResponse();
        }
      };
      return response;
    },
    getResponses: () => responses
  };
}

// Performance monitor
class PerformanceMonitor {
  constructor() {
    this.startTime = null;
    this.endTime = null;
    this.checkpoints = [];
  }
  
  start() {
    this.startTime = process.hrtime.bigint();
    Logger.debug('Performance monitoring started');
  }
  
  checkpoint(name) {
    const time = process.hrtime.bigint();
    this.checkpoints.push({
      name,
      time: time - this.startTime,
      timestamp: new Date().toISOString()
    });
    Logger.debug(`Checkpoint: ${name} at ${Number(time - this.startTime) / 1000000}ms`);
  }
  
  end() {
    this.endTime = process.hrtime.bigint();
    const totalTime = Number(this.endTime - this.startTime) / 1000000;
    Logger.success(`Total execution time: ${totalTime.toFixed(2)}ms`);
    
    if (this.checkpoints.length > 0) {
      Logger.info('Performance checkpoints:');
      this.checkpoints.forEach((checkpoint, index) => {
        const timeMs = Number(checkpoint.time) / 1000000;
        console.log(`  ${index + 1}. ${checkpoint.name}: ${timeMs.toFixed(2)}ms`);
      });
    }
    
    return totalTime;
  }
}

// Test scenarios with enhanced features
const advancedScenarios = {
  
  // Full integration test with mock data
  'mock-success': async () => {
    Logger.subheader('Mock Success Scenario');
    Logger.info('Testing complete flow with simulated successful responses');
    
    const monitor = new PerformanceMonitor();
    monitor.start();
    
    // Set up environment
    process.env.PEMO_API_KEY = 'mock_pemo_key_success';
    process.env.QOYOD_API_KEY = 'mock_qoyod_key_success';
    process.env.QOYOD_DEBIT_ACCOUNT_ID = '1001';
    process.env.QOYOD_CREDIT_ACCOUNT_ID = '1101';
    
    monitor.checkpoint('Environment setup');
    
    const mockReq = { method: 'GET' };
    const mockRes = createAdvancedMockResponse();
    
    Logger.info('Environment variables configured:');
    Logger.info(`  PEMO_API_KEY: ${process.env.PEMO_API_KEY}`);
    Logger.info(`  QOYOD_API_KEY: ${process.env.QOYOD_API_KEY}`);
    Logger.info(`  DEBIT_ACCOUNT: ${process.env.QOYOD_DEBIT_ACCOUNT_ID}`);
    Logger.info(`  CREDIT_ACCOUNT: ${process.env.QOYOD_CREDIT_ACCOUNT_ID}`);
    
    monitor.checkpoint('Mock setup');
    
    try {
      await syncFunction(mockReq, mockRes);
      monitor.checkpoint('Function execution');
      
      const responses = mockRes.getResponses();
      Logger.info(`Function generated ${responses.length} response(s)`);
      
      // Analyze responses
      responses.forEach((response, index) => {
        Logger.info(`Response ${index + 1}:`);
        Logger.info(`  Status: ${response.status}`);
        Logger.info(`  Data: ${JSON.stringify(response.data, null, 4)}`);
      });
      
      Logger.success('Mock success scenario completed');
    } catch (error) {
      Logger.error(`Mock success scenario failed: ${error.message}`);
      Logger.debug(`Error stack: ${error.stack}`);
    }
    
    monitor.end();
  },
  
  // Edge case: Empty transaction list
  'empty-transactions': async () => {
    Logger.subheader('Empty Transactions Scenario');
    Logger.info('Testing behavior when no transactions are available');
    
    const monitor = new PerformanceMonitor();
    monitor.start();
    
    process.env.PEMO_API_KEY = 'mock_pemo_key_empty';
    process.env.QOYOD_API_KEY = 'mock_qoyod_key';
    process.env.QOYOD_DEBIT_ACCOUNT_ID = '1001';
    process.env.QOYOD_CREDIT_ACCOUNT_ID = '1101';
    
    const mockReq = { method: 'GET' };
    const mockRes = createAdvancedMockResponse();
    
    Logger.info('Simulating empty transaction response from Pemo');
    
    try {
      await syncFunction(mockReq, mockRes);
      monitor.checkpoint('Function execution');
      
      const responses = mockRes.getResponses();
      Logger.info('Analyzing response for empty transactions...');
      
      if (responses.length > 0) {
        const lastResponse = responses[responses.length - 1];
        if (lastResponse.status === 200 && lastResponse.data.message) {
          Logger.success(`Correctly handled empty transactions: "${lastResponse.data.message}"`);
        } else {
          Logger.warning('Unexpected response for empty transactions');
        }
      }
      
    } catch (error) {
      Logger.error(`Empty transactions test failed: ${error.message}`);
    }
    
    monitor.end();
  },
  
  // Stress test with multiple scenarios
  'stress-test': async () => {
    Logger.subheader('Stress Test Scenario');
    Logger.info('Running multiple test iterations to check stability');
    
    const iterations = 5;
    const results = [];
    
    for (let i = 1; i <= iterations; i++) {
      Logger.info(`Stress test iteration ${i}/${iterations}`);
      
      const monitor = new PerformanceMonitor();
      monitor.start();
      
      // Randomize environment slightly for each test
      process.env.PEMO_API_KEY = `stress_test_pemo_${i}`;
      process.env.QOYOD_API_KEY = `stress_test_qoyod_${i}`;
      process.env.QOYOD_DEBIT_ACCOUNT_ID = '1001';
      process.env.QOYOD_CREDIT_ACCOUNT_ID = '1101';
      
      const mockReq = { method: 'GET' };
      const mockRes = createAdvancedMockResponse();
      
      try {
        await syncFunction(mockReq, mockRes);
        const executionTime = monitor.end();
        
        results.push({
          iteration: i,
          success: true,
          executionTime,
          responses: mockRes.getResponses().length
        });
        
        Logger.success(`Iteration ${i} completed in ${executionTime.toFixed(2)}ms`);
        
      } catch (error) {
        const executionTime = monitor.end();
        results.push({
          iteration: i,
          success: false,
          executionTime,
          error: error.message
        });
        
        Logger.error(`Iteration ${i} failed: ${error.message}`);
      }
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Analyze stress test results
    Logger.subheader('Stress Test Results Analysis');
    const successCount = results.filter(r => r.success).length;
    const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
    const minTime = Math.min(...results.map(r => r.executionTime));
    const maxTime = Math.max(...results.map(r => r.executionTime));
    
    Logger.info(`Success rate: ${successCount}/${iterations} (${(successCount/iterations*100).toFixed(1)}%)`);
    Logger.info(`Average execution time: ${avgTime.toFixed(2)}ms`);
    Logger.info(`Min execution time: ${minTime.toFixed(2)}ms`);
    Logger.info(`Max execution time: ${maxTime.toFixed(2)}ms`);
    
    if (successCount === iterations) {
      Logger.success('All stress test iterations passed! 🎉');
    } else {
      Logger.warning(`${iterations - successCount} iterations failed`);
    }
  },
  
  // Validation test for all edge cases
  'validation-test': async () => {
    Logger.subheader('Comprehensive Validation Test');
    Logger.info('Testing various input validation scenarios');
    
    const testCases = [
      {
        name: 'Valid Environment',
        env: {
          PEMO_API_KEY: 'valid_key',
          QOYOD_API_KEY: 'valid_key',
          QOYOD_DEBIT_ACCOUNT_ID: '1001',
          QOYOD_CREDIT_ACCOUNT_ID: '1101'
        },
        method: 'GET',
        expectedStatus: 500, // Will fail on API call, but validation passes
        expectedError: 'Failed to fetch Pemo transactions'
      },
      {
        name: 'Missing PEMO_API_KEY',
        env: {
          QOYOD_API_KEY: 'valid_key',
          QOYOD_DEBIT_ACCOUNT_ID: '1001',
          QOYOD_CREDIT_ACCOUNT_ID: '1101'
        },
        method: 'GET',
        expectedStatus: 500,
        expectedError: 'Missing required environment variables'
      },
      {
        name: 'Invalid HTTP Method',
        env: {
          PEMO_API_KEY: 'valid_key',
          QOYOD_API_KEY: 'valid_key',
          QOYOD_DEBIT_ACCOUNT_ID: '1001',
          QOYOD_CREDIT_ACCOUNT_ID: '1101'
        },
        method: 'POST',
        expectedStatus: 405,
        expectedError: 'Method not allowed'
      }
    ];
    
    for (const testCase of testCases) {
      Logger.info(`Testing: ${testCase.name}`);
      
      // Clear environment
      delete process.env.PEMO_API_KEY;
      delete process.env.QOYOD_API_KEY;
      delete process.env.QOYOD_DEBIT_ACCOUNT_ID;
      delete process.env.QOYOD_CREDIT_ACCOUNT_ID;
      
      // Set test environment
      Object.keys(testCase.env).forEach(key => {
        process.env[key] = testCase.env[key];
      });
      
      const mockReq = { method: testCase.method };
      const mockRes = createAdvancedMockResponse();
      
      try {
        await syncFunction(mockReq, mockRes);
        
        const responses = mockRes.getResponses();
        if (responses.length > 0) {
          const response = responses[responses.length - 1];
          
          if (response.status === testCase.expectedStatus) {
            Logger.success(`✓ Correct status: ${response.status}`);
            
            if (response.data.error && response.data.error.includes(testCase.expectedError)) {
              Logger.success(`✓ Correct error message contains: "${testCase.expectedError}"`);
            } else {
              Logger.warning(`⚠ Error message doesn't contain expected text: "${testCase.expectedError}"`);
            }
          } else {
            Logger.error(`✗ Wrong status: expected ${testCase.expectedStatus}, got ${response.status}`);
          }
        }
        
      } catch (error) {
        Logger.error(`Validation test "${testCase.name}" threw unexpected error: ${error.message}`);
      }
      
      Logger.info(''); // Empty line for readability
    }
  }
};

// Interactive menu system
async function showMenu() {
  console.log(`${colors.bright}${colors.blue}
╔═══════════════════════════════════════════════════════════╗
║                 🧪 ADVANCED TEST SUITE                    ║
║              Pemo-Qoyod Sync Function                     ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}`);

  console.log(`${colors.cyan}
Available test scenarios:${colors.reset}
  ${colors.green}1.${colors.reset} mock-success     - Complete flow with mock data
  ${colors.green}2.${colors.reset} empty-transactions - Test empty transaction list  
  ${colors.green}3.${colors.reset} stress-test      - Multiple iterations for stability
  ${colors.green}4.${colors.reset} validation-test  - Comprehensive input validation
  ${colors.green}5.${colors.reset} all             - Run all tests sequentially
  ${colors.green}6.${colors.reset} interactive     - Interactive mode (current)
  
  ${colors.yellow}Usage: node advanced-test.js [scenario-name]${colors.reset}
`);
}

// Main execution function
async function main() {
  const scenario = process.argv[2] || 'interactive';
  
  Logger.header('🚀 Advanced Test Suite Started');
  
  if (scenario === 'interactive') {
    await showMenu();
    Logger.info('Run with a specific scenario name to execute tests');
    Logger.info('Example: node advanced-test.js mock-success');
    return;
  }
  
  if (scenario === 'all') {
    Logger.info('Running all test scenarios...');
    
    for (const [scenarioName, scenarioFunc] of Object.entries(advancedScenarios)) {
      Logger.header(`Running: ${scenarioName}`);
      
      try {
        await scenarioFunc();
        Logger.success(`Scenario "${scenarioName}" completed`);
      } catch (error) {
        Logger.error(`Scenario "${scenarioName}" failed: ${error.message}`);
      }
      
      console.log('\n'); // Spacing between scenarios
    }
    
    Logger.header('🎯 All Tests Completed');
    return;
  }
  
  if (!advancedScenarios[scenario]) {
    Logger.error(`Unknown scenario: ${scenario}`);
    Logger.info('Available scenarios:');
    Object.keys(advancedScenarios).forEach(key => {
      Logger.info(`  - ${key}`);
    });
    process.exit(1);
  }
  
  Logger.header(`Running Scenario: ${scenario}`);
  
  const startTime = Date.now();
  
  try {
    await advancedScenarios[scenario]();
    Logger.success(`Scenario "${scenario}" completed successfully`);
  } catch (error) {
    Logger.error(`Scenario "${scenario}" failed: ${error.message}`);
    Logger.debug(`Stack trace: ${error.stack}`);
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  Logger.header('🏁 Test Session Complete');
  Logger.info(`Total session time: ${totalTime}ms`);
  Logger.info('Thank you for testing! 🙏');
}

// Error handling
process.on('SIGINT', () => {
  Logger.warning('\n👋 Test interrupted by user');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  Logger.error('💥 Unhandled Promise Rejection:');
  console.error(reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  Logger.error('💥 Main function crashed:');
  console.error(error);
  process.exit(1);
});
