import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures that all required environment variables are present
 * @param {string[]} requiredVars - Array of environment variable names to check
 * @throws {Error} - Throws an error with helpful message if any variables are missing
 */
export function ensureEnv(requiredVars) {
  const missing = requiredVars.filter(varName => {
    const value = import.meta.env[varName];
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    const missingList = missing.map(name => `  - ${name}`).join('\n');
    throw new Error(
      `Missing required environment variables:\n${missingList}\n\n` +
      `Please check your .env or .env.local file and ensure all Firebase configuration variables are set.\n` +
      `Required variables: ${requiredVars.join(', ')}\n\n` +
      `IMPORTANT: For storage bucket, use the format: PROJECT_ID.firebasestorage.app\n` +
      `(Projects created after Oct 30, 2024 use .firebasestorage.app instead of .appspot.com)`
    );
  }

  // Additional validation for storage bucket format
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  if (storageBucket && storageBucket.endsWith('.app') && !storageBucket.endsWith('.firebasestorage.app')) {
    throw new Error(
      `Invalid storage bucket format: ${storageBucket}\n\n` +
      `Storage bucket should end with '.firebasestorage.app' for projects created after Oct 30, 2024.\n` +
      `Please update VITE_FIREBASE_STORAGE_BUCKET in your .env/.env.local file.\n` +
      `Expected format: PROJECT_ID.firebasestorage.app`
    );
  }
} 