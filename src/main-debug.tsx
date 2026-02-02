import React from "react";
import { createRoot } from "react-dom/client";
import DebugApp from "./App-debug.tsx";
import "./index.css";

// Enhanced debugging for production issues
const debugLog = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`, data || '');
};

// Global error tracking
let errorCount = 0;
const MAX_ERRORS = 5;

const handleError = (error: Error, context: string) => {
  errorCount++;
  debugLog(`❌ Error #${errorCount} in ${context}:`, error.message);
  
  if (errorCount >= MAX_ERRORS) {
    debugLog('🚨 Too many errors, showing fallback UI');
    showFallbackUI('Too many errors occurred');
    return;
  }
  
  // Show specific error info
  showFallbackUI(error.message, context);
};

const showFallbackUI = (message: string, context?: string) => {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a0a0a;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 2rem;
      ">
        <div style="text-align: center; max-width: 600px;">
          <div style="
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: bold;
          ">S</div>
          
          <h1 style="
            font-size: 2.5rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">Seltech</h1>
          
          <p style="
            font-size: 1.125rem;
            color: #9ca3af;
            margin-bottom: 1rem;
          ">Digital Marketplace for Developers</p>
          
          <div style="
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
          ">
            <h3 style="color: #f59e0b; margin-bottom: 0.5rem; font-size: 1rem;">Debug Information</h3>
            <p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <strong>Error:</strong> ${message}
            </p>
            ${context ? `<p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <strong>Context:</strong> ${context}
            </p>` : ''}
            <p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <strong>Environment:</strong> ${import.meta.env.MODE || 'unknown'}
            </p>
            <p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <strong>Timestamp:</strong> ${new Date().toLocaleString()}
            </p>
            <p style="color: #d1d5db; font-size: 0.875rem;">
              <strong>Error Count:</strong> ${errorCount}/${MAX_ERRORS}
            </p>
          </div>
          
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.location.reload()" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 500;
              transition: background-color 0.2s;
            " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
              🔄 Reload Page
            </button>
            
            <button onclick="window.location.href='/'" style="
              background: #059669;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              cursor: pointer;
              font-size: 1rem;
              font-weight: 500;
              transition: background-color 0.2s;
            " onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#059669'">
              🏠 Go Home
            </button>
          </div>
          
          <p style="
            color: #6b7280;
            font-size: 0.875rem;
            margin-top: 2rem;
            line-height: 1.5;
          ">
            If this issue persists, please contact our support team.<br>
            We apologize for the inconvenience.
          </p>
        </div>
      </div>
    `;
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  handleError(event.error || new Error(event.message), 'Global Error Handler');
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(new Error(event.reason?.message || 'Promise Rejection'), 'Unhandled Promise');
});

// Debug initialization
debugLog("🔧 Debug App Starting...");
debugLog("Environment Details:", {
  mode: import.meta.env.MODE,
  dev: import.meta.env.DEV,
  prod: import.meta.env.PROD,
  reactVersion: React.version,
  userAgent: navigator.userAgent,
  url: window.location.href
});

// Check critical dependencies
const checkDependencies = () => {
  const checks = [
    { name: 'React', check: () => React.version, required: true },
    { name: 'DOM', check: () => document.getElementById("root"), required: true },
    { name: 'Supabase URL', check: () => import.meta.env.VITE_SUPABASE_URL, required: false },
  ];

  checks.forEach(({ name, check, required }) => {
    try {
      const result = check();
      if (result) {
        debugLog(`✅ ${name}: OK`, result);
      } else if (required) {
        throw new Error(`${name} is required but not available`);
      } else {
        debugLog(`⚠️ ${name}: Missing (optional)`);
      }
    } catch (error) {
      debugLog(`❌ ${name}: Failed`, error);
      if (required) {
        handleError(error instanceof Error ? error : new Error(`${name} check failed`), 'Dependency Check');
        return;
      }
    }
  });
};

// Initialize app
const initializeApp = () => {
  debugLog("🚀 Initializing React App...");
  
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    handleError(new Error("Root element not found in DOM"), 'App Initialization');
    return;
  }

  try {
    const root = createRoot(rootElement);
    root.render(<DebugApp />);
    debugLog("✅ Debug app rendered successfully");
  } catch (error) {
    handleError(error instanceof Error ? error : new Error('Unknown rendering error'), 'React Render');
  }
};

// Run checks and initialize
checkDependencies();
initializeApp();