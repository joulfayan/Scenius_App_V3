#!/usr/bin/env node

/**
 * Firebase Configuration Checker
 * 
 * This script helps verify that your Firebase configuration is correct,
 * especially the storage bucket format.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

function checkStorageBucketFormat(bucket) {
  if (!bucket) return { valid: false, message: 'Not set' };
  
  if (bucket.endsWith('.firebasestorage.app')) {
    return { valid: true, message: '✓ Correct format (new projects after Oct 30, 2024)' };
  } else if (bucket.endsWith('.appspot.com')) {
    return { valid: true, message: '✓ Legacy format (older projects)' };
  } else if (bucket.endsWith('.app')) {
    return { valid: false, message: '⚠ Should be .firebasestorage.app for new projects' };
  } else {
    return { valid: false, message: '❌ Unknown format' };
  }
}

function main() {
  console.log('🔍 Checking Firebase Configuration...\n');
  
  // Try to load .env.local first, then .env
  const envLocal = loadEnvFile('.env.local');
  const env = loadEnvFile('.env');
  const envVars = { ...env, ...envLocal }; // .env.local takes precedence
  
  let hasErrors = false;
  
  console.log('📋 Environment Variables:');
  requiredVars.forEach(varName => {
    const value = envVars[varName];
    if (!value || value.trim() === '') {
      console.log(`  ❌ ${varName}: Not set`);
      hasErrors = true;
    } else {
      console.log(`  ✅ ${varName}: Set`);
    }
  });
  
  console.log('\n🪣 Storage Bucket Format:');
  const storageBucket = envVars.VITE_FIREBASE_STORAGE_BUCKET;
  const bucketCheck = checkStorageBucketFormat(storageBucket);
  
  if (bucketCheck.valid) {
    console.log(`  ${bucketCheck.message}`);
  } else {
    console.log(`  ${bucketCheck.message}`);
    hasErrors = true;
  }
  
  console.log('\n📝 Recommendations:');
  if (hasErrors) {
    console.log('  1. Create a .env.local file in your project root');
    console.log('  2. Add all required Firebase configuration variables');
    console.log('  3. For new projects, use storage bucket format: PROJECT_ID.firebasestorage.app');
    console.log('  4. For older projects, you can use: PROJECT_ID.appspot.com');
    console.log('\n📖 See ENVIRONMENT_SETUP.md for detailed instructions');
  } else {
    console.log('  ✅ All configuration looks good!');
  }
  
  process.exit(hasErrors ? 1 : 0);
}

// Run the script
main();

export { loadEnvFile, checkStorageBucketFormat };
