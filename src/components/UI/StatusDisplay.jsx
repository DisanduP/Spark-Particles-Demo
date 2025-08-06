import React from 'react';

export const StatusDisplay = ({ statusInfo, theme }) => {
  const isLightTheme = theme?.mode === 'light';
  
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      background: isLightTheme ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
      color: isLightTheme ? '#333333' : 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontFamily: 'monospace',
      pointerEvents: 'none',
      lineHeight: '1.4',
      minWidth: '220px',
      border: isLightTheme ? '1px solid rgba(0,0,0,0.1)' : 'none'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>System Status</div>
      <div>Renderer: {statusInfo.renderer}</div>
      <div>Shaders: {statusInfo.shaderMode}</div>
      <div>Particles: {statusInfo.particleCount} / {statusInfo.maxParticles}</div>
      <div>FPS: {statusInfo.fps}</div>
    </div>
  );
};

export default StatusDisplay;
