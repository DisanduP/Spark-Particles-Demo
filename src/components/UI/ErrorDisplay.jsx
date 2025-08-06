import React from 'react';

export const ErrorDisplay = ({ error, theme }) => {
  const isLightTheme = theme?.mode === 'light';
  
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isLightTheme ? '#f5f5f5' : '#1a1a1a'
    }}>
      <div style={{
        background: isLightTheme ? 'white' : '#2a2a2a',
        color: isLightTheme ? '#333' : 'white',
        padding: '24px',
        borderRadius: '8px',
        border: isLightTheme ? '1px solid #ddd' : '1px solid #444',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h3>WebGL Error</h3>
        <p>{error}</p>
        <p style={{ fontSize: '0.9em', opacity: 0.8 }}>
          Your browser may not support WebGL or it may be disabled.
        </p>
      </div>
    </div>
  );
};

export default ErrorDisplay;
