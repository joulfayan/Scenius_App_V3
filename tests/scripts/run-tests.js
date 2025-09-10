#!/usr/bin/env node

// Test Runner Script
// Provides additional test execution options and utilities

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_COMMANDS = {
  'all': 'npx playwright test',
  'flow': 'npx playwright test tests/scenius-flow.spec.js',
  'assistant': 'npx playwright test tests/assistant-integration.spec.js',
  'firestore': 'npx playwright test tests/firestore-integration.spec.js',
  'callsheet': 'npx playwright test tests/callsheet-generation.spec.js',
  'ui': 'npx playwright test --ui',
  'headed': 'npx playwright test --headed',
  'debug': 'npx playwright test --debug',
  'report': 'npx playwright show-report'
};

const BROWSERS = ['chromium', 'firefox', 'webkit'];

function printUsage() {
  console.log(`
🧪 Scenius App Test Runner

Usage: node tests/scripts/run-tests.js [command] [options]

Commands:
  all         Run all tests (default)
  flow        Run main flow tests only
  assistant   Run AI assistant tests only
  firestore   Run Firestore integration tests only
  ui          Run tests with UI
  headed      Run tests in headed mode
  debug       Run tests in debug mode
  report      Show test report

Options:
  --browser   Specify browser (chromium, firefox, webkit)
  --parallel  Run tests in parallel (default: true)
  --retries   Number of retries for failed tests (default: 2)
  --timeout   Test timeout in milliseconds (default: 30000)
  --help      Show this help message

Examples:
  node tests/scripts/run-tests.js flow --browser chromium
  node tests/scripts/run-tests.js all --headed --retries 1
  node tests/scripts/run-tests.js ui --browser firefox
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  const options = {};
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help') {
      printUsage();
      process.exit(0);
    } else if (arg === '--browser') {
      options.browser = args[++i];
    } else if (arg === '--parallel') {
      options.parallel = args[++i] === 'true';
    } else if (arg === '--retries') {
      options.retries = parseInt(args[++i]);
    } else if (arg === '--timeout') {
      options.timeout = parseInt(args[++i]);
    }
  }
  
  return { command, options };
}

function buildCommand(command, options) {
  let cmd = TEST_COMMANDS[command];
  
  if (!cmd) {
    console.error(`❌ Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  }
  
  // Add browser option
  if (options.browser) {
    if (!BROWSERS.includes(options.browser)) {
      console.error(`❌ Invalid browser: ${options.browser}. Must be one of: ${BROWSERS.join(', ')}`);
      process.exit(1);
    }
    cmd += ` --project=${options.browser}`;
  }
  
  // Add other options
  if (options.retries !== undefined) {
    cmd += ` --retries=${options.retries}`;
  }
  
  if (options.timeout !== undefined) {
    cmd += ` --timeout=${options.timeout}`;
  }
  
  if (options.parallel === false) {
    cmd += ` --workers=1`;
  }
  
  return cmd;
}

function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  // Check if Playwright is installed
  try {
    execSync('npx playwright --version', { stdio: 'pipe' });
    console.log('✅ Playwright is installed');
  } catch (error) {
    console.error('❌ Playwright is not installed. Run: npm install');
    process.exit(1);
  }
  
  // Check if browsers are installed
  try {
    execSync('npx playwright install --dry-run', { stdio: 'pipe' });
    console.log('✅ Playwright browsers are installed');
  } catch (error) {
    console.log('⚠️  Some browsers may not be installed. Run: npx playwright install');
  }
  
  // Check if dev server is running
  try {
    execSync('curl -s http://localhost:5173 > /dev/null', { stdio: 'pipe' });
    console.log('✅ Dev server is running');
  } catch (error) {
    console.log('⚠️  Dev server may not be running. Start with: npm run dev');
  }
}

function runTests(command, options) {
  console.log(`🚀 Running tests: ${command}`);
  console.log(`📋 Options:`, options);
  
  const cmd = buildCommand(command, options);
  console.log(`💻 Command: ${cmd}`);
  
  try {
    execSync(cmd, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ Tests completed successfully!');
  } catch (error) {
    console.error('❌ Tests failed');
    process.exit(1);
  }
}

function generateTestReport() {
  console.log('📊 Generating test report...');
  
  const reportPath = path.join(process.cwd(), 'playwright-report');
  if (fs.existsSync(reportPath)) {
    console.log(`📈 Test report available at: ${reportPath}/index.html`);
    console.log('💻 Open with: npm run test:report');
  } else {
    console.log('⚠️  No test report found. Run tests first.');
  }
}

function main() {
  const { command, options } = parseArgs();
  
  console.log('🧪 Scenius App Test Runner');
  console.log('========================\n');
  
  checkPrerequisites();
  
  if (command === 'report') {
    generateTestReport();
  } else {
    runTests(command, options);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  buildCommand,
  checkPrerequisites,
  runTests,
  generateTestReport
};
