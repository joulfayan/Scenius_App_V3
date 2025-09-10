import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Conditionally alias diagnostic page based on mode
      ...(mode === 'development' && {
        './diag': path.resolve(__dirname, './src/pages/diag.dev.jsx')
      })
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  define: {
    // Define environment variables for build-time optimization
    __DEV_DIAGNOSTICS__: mode === 'development'
  },
  build: {
    rollupOptions: {
      external: mode === 'production' ? ['./diag'] : [],
      output: {
        manualChunks: mode === 'production' ? (id) => {
          // Exclude diagnostic files from production chunks
          if (id.includes('diag')) {
            return undefined;
          }
        } : undefined
      }
    }
  }
})) 