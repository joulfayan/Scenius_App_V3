#!/usr/bin/env node

/**
 * Test Development Setup
 * 
 * This script tests if the development setup is working correctly
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkPort(port) {
  try {
    const response = await fetch(`http://localhost:${port}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function testDevSetup() {
  log('🧪 Testing Development Setup...', 'blue');
  log('');

  // Test 1: Check if Vite dev server starts
  log('1. Testing Vite dev server...', 'yellow');
  const viteProcess = spawn('npm', ['run', 'dev'], { 
    stdio: 'pipe',
    shell: true 
  });

  // Wait for Vite to start
  await setTimeout(5000);

  const viteRunning = await checkPort(5173);
  if (viteRunning) {
    log('   ✅ Vite dev server is running on port 5173', 'green');
  } else {
    log('   ❌ Vite dev server failed to start', 'red');
  }

  // Kill Vite process
  viteProcess.kill();

  // Test 2: Check if Vercel dev server starts
  log('2. Testing Vercel dev server...', 'yellow');
  const vercelProcess = spawn('npm', ['run', 'dev:api'], { 
    stdio: 'pipe',
    shell: true 
  });

  // Wait for Vercel to start
  await setTimeout(8000);

  const vercelRunning = await checkPort(3001);
  if (vercelRunning) {
    log('   ✅ Vercel dev server is running on port 3001', 'green');
  } else {
    log('   ❌ Vercel dev server failed to start', 'red');
  }

  // Kill Vercel process
  vercelProcess.kill();

  // Test 3: Check if concurrently works
  log('3. Testing concurrent setup...', 'yellow');
  const concurrentProcess = spawn('npm', ['run', 'dev:all'], { 
    stdio: 'pipe',
    shell: true 
  });

  // Wait for both servers to start
  await setTimeout(10000);

  const bothRunning = await checkPort(5173) && await checkPort(3001);
  if (bothRunning) {
    log('   ✅ Both servers are running concurrently', 'green');
  } else {
    log('   ❌ Concurrent setup failed', 'red');
  }

  // Kill concurrent process
  concurrentProcess.kill();

  log('');
  log('🎉 Development setup test completed!', 'blue');
  log('');
  log('To start development:', 'bold');
  log('  npm run dev:all', 'green');
  log('');
  log('URLs:', 'bold');
  log('  Frontend: http://localhost:5173', 'cyan');
  log('  API: http://localhost:3001/api/ai', 'cyan');
}

// Run the test
testDevSetup().catch(console.error);
