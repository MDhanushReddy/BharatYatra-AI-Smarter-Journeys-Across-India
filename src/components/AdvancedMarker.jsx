import React, { useEffect, useRef } from 'react';
import { createPinMarker, getCategoryColor, getCategoryIcon } from '../utils/advancedMarkers';

/**
 * Advanced Marker Component
 * Wrapper for Google Maps Advanced Markers API
 */
const AdvancedMarker = ({ 
  map, 
  position, 
  data, 
  onClick, 
  category = 'default',
  isNearby = false,
  dayNumber,
  markersRef 
}) => {
  const markerRef = useRef(null);
  
  useEffect(() => {
    if (!map || !position || !window.google) return;
    
    // Wait for Advanced Marker library to be available
    const initMarker = async () => {
      try {
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker');
        
        if (!AdvancedMarkerElement) {
          console.warn('Advanced Markers not available');
          return;
        }
        
        // Create marker data
        const markerData = data || {
          name: `Location ${dayNumber || ''}`,
          category: category
        };
        
        // Create pin element
        const pinElement = createPinMarker(markerData, category);
        
        // Add day number if provided
        if (dayNumber) {
          const dayBadge = document.createElement('div');
          dayBadge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #4285F4;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          `;
          dayBadge.textContent = dayNumber;
          pinElement.style.position = 'relative';
          pinElement.appendChild(dayBadge);
        }
        
        // Create Advanced Marker
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: position.lat || position[0], lng: position.lng || position[1] },
          content: pinElement,
          title: markerData.name || 'Location',
          zIndex: isNearby ? 1 : (dayNumber ? dayNumber + 10 : 2)
        });
        
        // Add click handler
        if (onClick) {
          pinElement.addEventListener('click', (e) => {
            e.stopPropagation();
            onClick();
          });
        }
        
        markerRef.current = marker;
        if (markersRef && markersRef.current) {
          markersRef.current.push(marker);
        }
        
      } catch (error) {
        console.error('Error creating Advanced Marker:', error);
      }
    };
    
    initMarker();
    
    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        if (markersRef && markersRef.current) {
          const index = markersRef.current.indexOf(markerRef.current);
          if (index > -1) {
            markersRef.current.splice(index, 1);
          }
        }
      }
    };
  }, [map, position, data, category, isNearby, dayNumber, onClick, markersRef]);
  
  return null; // Advanced Markers don't render as React components
};

export default AdvancedMarker;

