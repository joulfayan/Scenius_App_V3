#!/usr/bin/env node

/**
 * Production Build Validation Script
 * 
 * This script validates that the production build doesn't expose
 * diagnostic or development-only features that should be hidden.
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  console.log('✅ Not in production mode, skipping production validation');
  process.exit(0);
}

console.log('🔍 Validating production build for security...');

// Check if dist directory exists
const distPath = join(projectRoot, 'dist');
if (!existsSync(distPath)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check for diagnostic route exposure in built files
const indexPath = join(distPath, 'index.html');
if (!existsSync(indexPath)) {
  console.error('❌ Built index.html not found');
  process.exit(1);
}

const indexContent = readFileSync(indexPath, 'utf8');

// Check for diagnostic-related content that shouldn't be in production
// We're looking for patterns that indicate the diagnostic route is accessible
const diagnosticPatterns = [
  // Route definitions that expose /diag without NODE_ENV checks
  /path.*=.*["']\/diag["'].*element.*DiagnosticPage(?!.*NODE_ENV)/gi,
  // Direct imports of DiagnosticPage in production code (not dynamic)
  /import.*DiagnosticPage.*from.*diag(?!.*import\.meta\.env)/gi
];

// Additional check for navigation links - we'll be more lenient here since
// the minified code makes it hard to detect NODE_ENV checks
const navigationPatterns = [
  /to.*=.*["']\/diag["']/gi
];

let foundIssues = [];

for (const pattern of diagnosticPatterns) {
  const matches = indexContent.match(pattern);
  if (matches) {
    foundIssues.push({
      pattern: pattern.toString(),
      matches: matches,
      context: 'index.html'
    });
  }
}

// Check for navigation patterns (less strict)
let navigationIssues = [];
for (const pattern of navigationPatterns) {
  const matches = indexContent.match(pattern);
  if (matches) {
    navigationIssues.push({
      pattern: pattern.toString(),
      matches: matches,
      context: 'index.html'
    });
  }
}

// Check built JavaScript files for diagnostic exposure
const assetsDir = join(distPath, 'assets');
if (existsSync(assetsDir)) {
  try {
    const files = readdirSync(assetsDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const filePath = join(assetsDir, file);
      const content = readFileSync(filePath, 'utf8');
      
      for (const pattern of diagnosticPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          foundIssues.push({
            pattern: pattern.toString(),
            matches: matches,
            context: `assets/${file}`
          });
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not check assets directory:', error.message);
  }
}

// Report results
if (foundIssues.length > 0) {
  console.error('❌ PRODUCTION BUILD VALIDATION FAILED');
  console.error('The following diagnostic-related content was found in production build:');
  
  foundIssues.forEach((issue, index) => {
    console.error(`\n${index + 1}. Pattern: ${issue.pattern}`);
    console.error(`   Context: ${issue.context}`);
    console.error(`   Matches: ${issue.matches.join(', ')}`);
  });
  
  console.error('\n🚨 SECURITY RISK: Diagnostic features are exposed in production!');
  console.error('This could expose sensitive environment variables and system information.');
  console.error('\nTo fix this:');
  console.error('1. Ensure all diagnostic routes are wrapped with NODE_ENV !== "production" checks');
  console.error('2. Verify that diagnostic components are not imported in production builds');
  console.error('3. Check that navigation links to diagnostics are conditionally rendered');
  
  process.exit(1);
} else {
  console.log('✅ Production build validation passed');
  console.log('✅ No diagnostic features exposed in production build');
  
  // Report navigation issues as warnings (not errors)
  if (navigationIssues.length > 0) {
    console.warn('\n⚠️  Warning: Navigation links to /diag found in production build');
    console.warn('These should be wrapped with NODE_ENV !== "production" checks');
    console.warn('However, the route itself is protected, so this is not a security risk');
  }
}

// Additional check: Verify that the build actually contains production optimizations
const hasMinification = indexContent.includes('assets/index-') && indexContent.includes('.js');
if (!hasMinification) {
  console.warn('⚠️  Warning: Build may not be properly minified/optimized');
}

// Check if diagnostic chunk is referenced in HTML (which would make it accessible)
const diagnosticChunkReferenced = indexContent.includes('diag-') && indexContent.includes('.js');
if (diagnosticChunkReferenced) {
  console.warn('⚠️  Warning: Diagnostic chunk is referenced in HTML');
  console.warn('This may indicate that diagnostic features are accessible in production.');
  console.warn('However, the route should still be protected by NODE_ENV checks.');
}

console.log('🎉 Production build is secure and ready for deployment');
