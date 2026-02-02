import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Production-ready error handling
const handleGlobalError = (error: Error, errorInfo?: any) => {
  console.error('Production Error:', error, errorInfo);
  
  // Show user-friendly error page
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        color: #fff;
        font-family: system-ui, -apple-system, sans-serif;
        text-align: center;
        padding: 20px;
      ">
        <div>
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem; color: #3b82f6;">Seltech</h1>
          <p style="margin-bottom: 1rem; color: #888;">We're experiencing technical difficulties</p>
          <p style="font-size: 0.875rem; color: #666; margin-bottom: 2rem;">
            Our team has been notified and is working to resolve this issue.
          </p>
          <button onclick="window.location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 500;
          ">
            Try Again
          </button>
        </div>
      </div>
    `;
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  handleGlobalError(event.error || new Error(event.message));
});

window.addEventListener('unhandledrejection', (event) => {
  handleGlobalError(new Error(event.reason?.message || 'Promise rejection'));
});

// Production logging
console.log("🚀 Seltech Production App Starting...");
console.log("Environment:", import.meta.env.MODE);
console.log("React Version:", React.version);

// Verify environment variables
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn("Missing environment variables:", missingVars);
}

// Initialize app
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  handleGlobalError(new Error("Root element not found"));
} else {
  console.log("✅ Root element found, initializing React app...");
  
  try {
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("✅ Production app rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering production app:", error);
    handleGlobalError(error instanceof Error ? error : new Error('Unknown rendering error'));
  }
}