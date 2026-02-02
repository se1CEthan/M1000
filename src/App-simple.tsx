import { BrowserRouter, Routes, Route } from "react-router-dom";

// Simple test components
const HomePage = () => (
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
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Seltech</h1>
      <p style={{ color: '#888', marginBottom: '2rem' }}>Digital Marketplace for Developers</p>
      <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '2rem' }}>
        Environment: {import.meta.env.MODE} | Node: {import.meta.env.VITE_NODE_ENV || 'undefined'}
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <a href="/marketplace" style={{ 
          color: '#3b82f6', 
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          border: '1px solid #3b82f6',
          borderRadius: '0.375rem'
        }}>
          Marketplace
        </a>
        <a href="/auth" style={{ 
          color: '#fff', 
          textDecoration: 'none',
          padding: '0.5rem 1rem',
          background: '#3b82f6',
          borderRadius: '0.375rem'
        }}>
          Get Started
        </a>
      </div>
    </div>
  </div>
);

const MarketplacePage = () => (
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Marketplace</h1>
      <p style={{ color: '#888' }}>Simple test page - React is working!</p>
      <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Back to Home</a>
    </div>
  </div>
);

const AuthPage = () => (
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
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sign In</h1>
      <p style={{ color: '#888' }}>Simple test page - Authentication coming soon...</p>
      <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>← Back to Home</a>
    </div>
  </div>
);

const SimpleApp = () => {
  console.log("🧪 Simple App rendering...");
  console.log("Environment:", import.meta.env.MODE);
  console.log("All env vars:", import.meta.env);
  
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default SimpleApp;