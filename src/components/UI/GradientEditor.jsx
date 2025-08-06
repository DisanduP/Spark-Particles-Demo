import React, { useState, useRef, useCallback } from 'react';
import { sampleGradient, rgbToHex } from '../../utils/gradientUtils.js';
import './GradientEditor.css';

const GradientEditor = ({ label, gradient, onChange, gradientKey }) => {
  const [draggedStop, setDraggedStop] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const [activeControlsStop, setActiveControlsStop] = useState(null);
  const timelineRef = useRef(null);

  // Sort stops by position for display
  const sortedStops = [...gradient].sort((a, b) => a.position - b.position);

  // Generate CSS gradient string for preview
  const gradientString = sortedStops.map(stop => 
    `${stop.color} ${(stop.position * 100).toFixed(1)}%`
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
    
    // Sample color at this position from current gradient
    const rgb = sampleGradient(sortedStops, position);
    const newColor = rgbToHex(rgb);
    
    const newStop = {
      position: Math.round(position * 100) / 100, // Round to 2 decimals
      color: newColor
    };
    
    const newGradient = [...gradient, newStop];
    onChange(gradientKey, newGradient);
  }, [gradient, gradientKey, onChange, draggedStop, justFinishedDragging, sortedStops]);

  const handleStopColorChange = useCallback((stopIndex, newColor) => {
    const newGradient = gradient.map((stop, index) => 
      index === stopIndex ? { ...stop, color: newColor } : stop
    );
    onChange(gradientKey, newGradient);
  }, [gradient, gradientKey, onChange]);

  const handleStopRemove = useCallback((stopIndex) => {
    if (gradient.length <= 2) return; // Keep minimum 2 stops
    
    const newGradient = gradient.filter((_, index) => index !== stopIndex);
    onChange(gradientKey, newGradient);
  }, [gradient, gradientKey, onChange]);

  const handleMouseDown = useCallback((e, stopIndex) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Check if we're clicking on the controls
    if (e.target.closest('.stop-controls')) {
      // Don't start dragging when interacting with controls
      return;
    }
    
    // Toggle controls visibility on click
    setActiveControlsStop(activeControlsStop === stopIndex ? null : stopIndex);
    
    const rect = timelineRef.current.getBoundingClientRect();
    const stopPosition = gradient[stopIndex].position * rect.width;
    const offset = e.clientX - rect.left - stopPosition;
    
    setDraggedStop(stopIndex);
    setDragOffset(offset);
  }, [gradient, activeControlsStop]);

  const handleMouseMove = useCallback((e) => {
    if (draggedStop === null) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const newPosition = Math.max(0, Math.min(1, (e.clientX - rect.left - dragOffset) / rect.width));
    
    const newGradient = gradient.map((stop, index) => 
      index === draggedStop ? { ...stop, position: Math.round(newPosition * 100) / 100 } : stop
    );
    onChange(gradientKey, newGradient);
  }, [draggedStop, dragOffset, gradient, gradientKey, onChange]);

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
    <div className="gradient-editor">
      <label className="gradient-editor-label">{label}</label>
      
      {/* Gradient Preview */}
      <div 
        className="gradient-preview"
        style={{ background: `linear-gradient(to right, ${gradientString})` }}
      />
      
      {/* Interactive Timeline */}
      <div 
        ref={timelineRef}
        className="gradient-timeline"
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
        
        {/* Color Stops */}
        {gradient.map((stop, index) => (
          <div
            key={index}
            className={`gradient-stop ${draggedStop === index ? 'dragging' : ''}`}
            style={{ 
              left: `${stop.position * 100}%`,
              backgroundColor: stop.color
            }}
            onMouseDown={(e) => handleMouseDown(e, index)}
          >
            <div className={`stop-controls ${activeControlsStop === index ? 'visible' : ''}`}>
              <input
                type="color"
                value={stop.color}
                onChange={(e) => handleStopColorChange(index, e.target.value)}
                className="stop-color-input"
                onClick={(e) => e.stopPropagation()}
              />
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
      <div className="gradient-instructions">
        Click timeline to add stops • Click stop to toggle controls • Drag stops to move • Max 5 stops
      </div>
    </div>
  );
};

export default GradientEditor;
