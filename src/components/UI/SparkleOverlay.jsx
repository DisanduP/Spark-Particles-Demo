import React from 'react';
import './SparkleOverlay.css';

const SparkleOverlay = () => {
  return (
    <div className="sparkle-overlay">
      <div className="sparkle-spinner-container">
        <svg 
          aria-hidden="true" 
          focusable="false" 
          className="sparkle-spinner" 
          viewBox="0 0 16 16" 
          width="24" 
          height="24" 
          fill="currentColor"
          style={{
            display: 'inline-block',
            overflow: 'visible',
            verticalAlign: 'text-bottom'
          }}
        >
          <path d="M7.53 1.282a.5.5 0 0 1 .94 0l.478 1.306a7.492 7.492 0 0 0 4.464 4.464l1.305.478a.5.5 0 0 1 0 .94l-1.305.478a7.492 7.492 0 0 0-4.464 4.464l-.478 1.305a.5.5 0 0 1-.94 0l-.478-1.305a7.492 7.492 0 0 0-4.464-4.464L1.282 8.47a.5.5 0 0 1 0-.94l1.306-.478a7.492 7.492 0 0 0 4.464-4.464Z"></path>
        </svg>
        <div className="loading-dots">
          Compiling creative thoughts
          <span className="dot" style={{'--i': 0}}>.</span>
          <span className="dot" style={{'--i': 1}}>.</span>
          <span className="dot" style={{'--i': 2}}>.</span>
        </div>
      </div>
    </div>
  );
};

export default SparkleOverlay;
