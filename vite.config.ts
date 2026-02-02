import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Force production mode if NODE_ENV is production
  const isProduction = mode === 'production' || process.env.NODE_ENV === 'production' || command === 'build';
  
  console.log(`🔧 Vite Config - Mode: ${mode}, Command: ${command}, IsProduction: ${isProduction}`);
  
  return {
    mode: isProduction ? 'production' : 'development',
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      allowedHosts: [
        "okx-liyh.onrender.com",
        "www.seltech.online",
        "seltech.online",
        "localhost",
        "127.0.0.1",
        ".onrender.com",
        ".seltech.online"
      ],
    },
    plugins: [
      react({
        // Simple, reliable JSX configuration
        jsxRuntime: 'automatic',
      }),
      // Only use component tagger in development
      !isProduction && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      // Production-optimized build settings
      target: 'es2020',
      minify: 'esbuild',
      sourcemap: false,
      cssCodeSplit: false, // Keep CSS in single file for better loading
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false,
      rollupOptions: {
        output: {
          // Optimized chunking strategy
          manualChunks: {
            // Core React libraries
            'react-vendor': ['react', 'react-dom'],
            // UI components
            'ui-components': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast'
            ],
            // Routing
            'router': ['react-router-dom'],
            // Forms and validation
            'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            // Utilities
            'utils': ['date-fns', 'clsx', 'tailwind-merge'],
            // Icons
            'icons': ['lucide-react'],
            // Supabase
            'supabase': ['@supabase/supabase-js'],
            // Query client
            'query': ['@tanstack/react-query']
          },
          // Optimize chunk names
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    define: {
      // Force production environment variables
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      'process.env.NODE_ENV': JSON.stringify('production'),
      'import.meta.env.MODE': JSON.stringify(isProduction ? 'production' : 'development'),
      'import.meta.env.PROD': JSON.stringify(isProduction),
      'import.meta.env.DEV': JSON.stringify(!isProduction),
    },
    // Production optimizations
    esbuild: {
      // Remove console logs in production (except errors and warnings)
      drop: isProduction ? ['console', 'debugger'] : [],
      // Force production JSX - this is the key fix
      jsx: 'automatic',
      jsxDev: false, // Always false to prevent jsxDEV issues
      jsxSideEffects: false,
    },
    // CSS optimizations - CRITICAL FIX
    css: {
      devSourcemap: false,
      // Ensure PostCSS processes Tailwind properly
      postcss: './postcss.config.js',
      // Ensure CSS is properly processed
      preprocessorOptions: {
        css: {
          charset: false
        }
      }
    }
  };
});
