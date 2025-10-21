import React, { useEffect, useState } from 'react';

const TestEnv = () => {
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    // Check all relevant environment variables
    const vars = {
      VITE_ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      NODE_ENV: import.meta.env.NODE_ENV,
    };
    
    setEnvVars(vars);
    
    // Log to console for debugging
    console.log('Environment variables:', vars);
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Environment Variable Test</h2>
      <div style={{ marginTop: '1rem' }}>
        <h3>VITE_ADMIN_PASSWORD:</h3>
        <p><strong>{envVars.VITE_ADMIN_PASSWORD || 'Not found'}</strong></p>
        
        <h3>VITE_SUPABASE_URL:</h3>
        <p><strong>{envVars.VITE_SUPABASE_URL ? 'Loaded' : 'Not found'}</strong></p>
        
        <h3>VITE_SUPABASE_ANON_KEY:</h3>
        <p><strong>{envVars.VITE_SUPABASE_ANON_KEY ? 'Loaded' : 'Not found'}</strong></p>
        
        <h3>NODE_ENV:</h3>
        <p><strong>{envVars.NODE_ENV || 'Not found'}</strong></p>
      </div>
      
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <h3>Expected Values:</h3>
        <p>VITE_ADMIN_PASSWORD: Sevimbebe4242.</p>
        <p>VITE_SUPABASE_URL: Should start with https://</p>
        <p>VITE_SUPABASE_ANON_KEY: Should be a long JWT token</p>
      </div>
    </div>
  );
};

export default TestEnv;