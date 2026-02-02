import { createRoot } from "react-dom/client";
import "./index.css";

// Minimal test component
const MinimalApp = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#000',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Seltech</h1>
        <p style={{ color: '#888' }}>Minimal test - React is working!</p>
        <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '1rem' }}>
          Environment: {import.meta.env.MODE}
        </p>
      </div>
    </div>
  );
};

console.log("🧪 Loading minimal test app...");
console.log("Environment:", import.meta.env.MODE);

const rootElement = document.getElementById("root");
if (rootElement) {
  try {
    createRoot(rootElement).render(<MinimalApp />);
    console.log("✅ Minimal app rendered successfully");
  } catch (error) {
    console.error("❌ Error rendering minimal app:", error);
  }
} else {
  console.error("❌ Root element not found");
}