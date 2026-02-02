import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// CSS loading verification
const verifyCSSLoaded = () => {
  // Check if Tailwind CSS is loaded by testing a known class
  const testElement = document.createElement('div');
  testElement.className = 'bg-background text-foreground';
  testElement.style.position = 'absolute';
  testElement.style.visibility = 'hidden';
  document.body.appendChild(testElement);
  
  const styles = window.getComputedStyle(testElement);
  const hasBackground = styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && styles.backgroundColor !== 'transparent';
  
  document.body.removeChild(testElement);
  
  if (!hasBackground) {
    console.warn('⚠️ Tailwind CSS may not be loaded properly');
    // Add basic fallback styles
    const fallbackCSS = `
      body { background: #0a0a0a !important; color: #ffffff !important; }
      .bg-background { background: #0a0a0a !important; }
      .text-foreground { color: #ffffff !important; }
      .bg-card { background: #1a1a1a !important; }
      .border { border: 1px solid #333 !important; }
      .rounded { border-radius: 0.5rem !important; }
      .p-4 { padding: 1rem !important; }
      .m-4 { margin: 1rem !important; }
      .flex { display: flex !important; }
      .items-center { align-items: center !important; }
      .justify-center { justify-content: center !important; }
      .text-center { text-align: center !important; }
      .text-xl { font-size: 1.25rem !important; }
      .text-2xl { font-size: 1.5rem !important; }
      .font-bold { font-weight: bold !important; }
      .mb-4 { margin-bottom: 1rem !important; }
      .mt-4 { margin-top: 1rem !important; }
      .btn, .bg-primary { background: #3b82f6 !important; color: white !important; padding: 0.75rem 1.5rem !important; border-radius: 0.5rem !important; border: none !important; cursor: pointer !important; }
      .btn:hover, .bg-primary:hover { background: #2563eb !important; }
    `;
    
    const style = document.createElement('style');
    style.textContent = fallbackCSS;
    document.head.appendChild(style);
  } else {
    console.log('✅ CSS loaded successfully');
  }
};

// Comprehensive error handling for production
const showFallbackUI = (message: string, details?: string) => {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
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
            margin-bottom: 2rem;
          ">Digital Marketplace for Developers</p>
          
          <div style="
            background: #1f2937;
            border: 1px solid #374151;
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
          ">
            <h3 style="color: #f59e0b; margin-bottom: 1rem; font-size: 1rem;">Status</h3>
            <p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <strong>Issue:</strong> ${message}
            </p>
            ${details ? `<p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <strong>Details:</strong> ${details}
            </p>` : ''}
            <p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.5rem;">
              <strong>Environment:</strong> ${import.meta.env.MODE || 'unknown'}
            </p>
            <p style="color: #d1d5db; font-size: 0.875rem;">
              <strong>Time:</strong> ${new Date().toLocaleString()}
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
            ">
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
            ">
              🏠 Home
            </button>
          </div>
          
          <p style="
            color: #6b7280;
            font-size: 0.875rem;
            margin-top: 2rem;
          ">
            If this issue persists, please try refreshing the page or contact support.
          </p>
        </div>
      </div>
    `;
  }
};

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global Error:', event.error);
  showFallbackUI('JavaScript Error', event.error?.message || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
  showFallbackUI('Promise Rejection', event.reason?.message || 'Promise was rejected');
});

// Debug logging
console.log("🚀 Seltech App Starting...");
console.log("Environment:", import.meta.env.MODE);
console.log("Vite Dev:", import.meta.env.DEV);
console.log("Vite Prod:", import.meta.env.PROD);
console.log("Base URL:", import.meta.env.BASE_URL);
console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');

// Check critical dependencies
try {
  if (typeof React === 'undefined') {
    console.error('React is not available');
    showFallbackUI('React Not Available', 'React library failed to load');
    throw new Error('React not available');
  }
  console.log("✅ React available");
} catch (error) {
  console.error('React check failed:', error);
  showFallbackUI('Dependency Check Failed', 'React library check failed');
}

// Initialize app
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("❌ Root element not found!");
  showFallbackUI('Root Element Missing', 'The #root element was not found in the HTML');
} else {
  console.log("✅ Root element found");
  
  try {
    console.log("🔄 Creating React root...");
    const root = createRoot(rootElement);
    
    // Verify CSS is loaded before rendering
    verifyCSSLoaded();
    
    console.log("🔄 Rendering App component...");
    root.render(<App />);
    
    console.log("✅ App rendered successfully");
    
    // Verify render after a short delay
    setTimeout(() => {
      if (rootElement.children.length === 0) {
        console.warn("⚠️ Root element is empty after render");
        showFallbackUI('Render Failed', 'App component did not render any content');
      } else {
        console.log("✅ Content rendered to DOM");
      }
    }, 1000);
    
  } catch (error) {
    console.error("❌ Error rendering app:", error);
    showFallbackUI('Render Error', error instanceof Error ? error.message : 'Unknown render error');
  }
}
