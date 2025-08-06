import React, { useState, useRef, useCallback } from 'react';
import { sampleOpacityGradient } from '../../utils/gradientUtils.js';
import './OpacityGradientEditor.css';

const OpacityGradientEditor = ({ label, gradient, onChange }) => {
  const [draggedStop, setDraggedStop] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const [activeControlsStop, setActiveControlsStop] = useState(null);
  const timelineRef = useRef(null);

  // Sort stops by position for display
  const sortedStops = [...gradient].sort((a, b) => a.position - b.position);

  // Generate CSS gradient string for preview (using alpha in rgba)
  const gradientString = sortedStops.map(stop => 
    `rgba(255, 255, 255, ${stop.opacity}) ${(stop.position * 100).toFixed(1)}%`
  ).join(', ');

  const handleTimelineClick = useCallback((e) => {
    if (draggedStop !== null || justFinishedDragging) return; // Don't add stops while dragging or just after dragging
    
    // Close any open controls when clicking on timeline
    setActiveControlsStop(null);
    
    const rect = timelineRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    
    // Don't add if we already have max stops
    if (gradient.length >= 5) return;
    
    // Check minimum distance from existing stops (5% of timeline width)
    const minDistance = 0.05;
    const tooClose = sortedStops.some(stop => 
      Math.abs(stop.position - position) < minDistance
    );
    
    if (tooClose) return;
    
    // Sample opacity at this position from current gradient
    const opacity = sampleOpacityGradient(sortedStops, position);
    
    const newStop = {
      position: Math.round(position * 100) / 100, // Round to 2 decimals
      opacity: Math.round(opacity * 100) / 100    // Round to 2 decimals
    };
    
    const newGradient = [...gradient, newStop];
    onChange('visual.opacityGradient', newGradient);
  }, [gradient, onChange, draggedStop, justFinishedDragging, sortedStops]);

  const handleStopOpacityChange = useCallback((stopIndex, newOpacity) => {
    const newGradient = gradient.map((stop, index) => 
      index === stopIndex ? { ...stop, opacity: parseFloat(newOpacity) } : stop
    );
    onChange('visual.opacityGradient', newGradient);
  }, [gradient, onChange]);

  const handleStopRemove = useCallback((stopIndex) => {
    if (gradient.length <= 2) return; // Keep minimum 2 stops
    
    const newGradient = gradient.filter((_, index) => index !== stopIndex);
    onChange('visual.opacityGradient', newGradient);
  }, [gradient, onChange]);

  const handleStopClick = useCallback((e, stopIndex) => {
    e.stopPropagation();
    // Toggle controls visibility on click
    setActiveControlsStop(activeControlsStop === stopIndex ? null : stopIndex);
  }, [activeControlsStop]);

  const handleMouseDown = useCallback((e, stopIndex) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Check if we're clicking on the controls
    if (e.target.closest('.stop-controls')) {
      // Don't start dragging when interacting with controls
      return;
    }
    
    const rect = timelineRef.current.getBoundingClientRect();
    const stopPosition = gradient[stopIndex].position * rect.width;
    const offset = e.clientX - rect.left - stopPosition;
    
    setDraggedStop(stopIndex);
    setDragOffset(offset);
  }, [gradient]);

  const handleMouseMove = useCallback((e) => {
    if (draggedStop === null) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const newPosition = Math.max(0, Math.min(1, (e.clientX - rect.left - dragOffset) / rect.width));
    
    const newGradient = gradient.map((stop, index) => 
      index === draggedStop ? { ...stop, position: Math.round(newPosition * 100) / 100 } : stop
    );
    onChange('visual.opacityGradient', newGradient);
  }, [draggedStop, dragOffset, gradient, onChange]);

  const handleMouseUp = useCallback(() => {
    if (draggedStop !== null) {
      setJustFinishedDragging(true);
      // Clear the flag after a short delay
      setTimeout(() => setJustFinishedDragging(false), 100);
    }
    setDraggedStop(null);
    setDragOffset(0);
  }, [draggedStop]);

  // Add global mouse event listeners when dragging
  React.useEffect(() => {
    if (draggedStop !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedStop, handleMouseMove, handleMouseUp]);

  return (
    <div className="opacity-gradient-editor">
      <label className="opacity-gradient-editor-label">{label}</label>
      
      {/* Gradient Preview */}
      <div className="opacity-gradient-preview">
        <div 
          className="opacity-gradient-bar"
          style={{ background: `linear-gradient(to right, ${gradientString})` }}
        />
        <div className="opacity-checkerboard" />
      </div>
      
      {/* Interactive Timeline */}
      <div 
        ref={timelineRef}
        className="opacity-gradient-timeline"
        onClick={handleTimelineClick}
      >
        {/* Position markers */}
        <div className="timeline-markers">
          {[0, 0.25, 0.5, 0.75, 1].map(pos => (
            <div 
              key={pos}
              className="timeline-marker"
              style={{ left: `${pos * 100}%` }}
            >
              <span className="timeline-label">{(pos * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
        
        {/* Opacity Stops */}
        {gradient.map((stop, index) => (
          <div
            key={index}
            className={`opacity-stop ${draggedStop === index ? 'dragging' : ''}`}
            style={{ 
              left: `${stop.position * 100}%`,
              backgroundColor: `rgba(255, 255, 255, ${stop.opacity})`
            }}
            onClick={(e) => handleStopClick(e, index)}
            onMouseDown={(e) => handleMouseDown(e, index)}
          >
            <div className={`stop-controls ${activeControlsStop === index ? 'visible' : ''}`}>
              <input
                type="text"
                value={Math.round(stop.opacity * 100)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const clampedValue = Math.max(0, Math.min(100, value));
                  handleStopOpacityChange(index, clampedValue / 100);
                }}
                className="stop-opacity-input"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  e.target.focus();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                }}
                placeholder="0-100"
              />
              <span className="opacity-value">%</span>
              {gradient.length > 2 && (
                <button
                  className="stop-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStopRemove(index);
                  }}
                  title="Remove stop"
                >
                  ×
                </button>
              )}
            </div>
            <div className={`stop-position ${activeControlsStop === index ? 'visible' : ''}`}>{(stop.position * 100).toFixed(0)}%</div>
          </div>
        ))}
      </div>
      
      {/* Instructions */}
      <div className="opacity-gradient-instructions">
        Click timeline to add stops • Click stop to toggle controls • Drag stops to move • Max 5 stops
      </div>
    </div>
  );
};

export default OpacityGradientEditor;
