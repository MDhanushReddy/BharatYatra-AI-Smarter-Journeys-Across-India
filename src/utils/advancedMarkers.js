/**
 * Advanced Markers Utility
 * Helper functions for creating and managing Google Maps Advanced Markers
 */

/**
 * Get category color for pin background
 */
export const getCategoryColor = (category) => {
  const colors = {
    monuments: '#EA4335',      // Red
    nature: '#34A853',          // Green
    religious: '#4285F4',       // Blue
    heritage: '#9C27B0',        // Purple
    wildlife: '#FF9800',        // Orange
    museums: '#FBBC04',         // Yellow
    shopping: '#E91E63',        // Pink
    nightlife: '#212121',       // Black
    food: '#795548',            // Brown
    festivals: '#00BCD4',       // Cyan
    accommodation: '#1976D2',    // Blue for hotels
    restaurant: '#F44336',      // Red for restaurants
    default: '#EA4335'          // Default red
  };
  return colors[category] || colors.default;
};

/**
 * Get category icon/emoji
 */
export const getCategoryIcon = (category) => {
  const icons = {
    monuments: '🏛️',
    nature: '🌲',
    religious: '🕌',
    heritage: '🏰',
    wildlife: '🦁',
    museums: '🏛️',
    shopping: '🛍️',
    nightlife: '🌃',
    food: '🍽️',
    festivals: '🎉',
    accommodation: '🏠',
    restaurant: '🍴',
    default: '📍'
  };
  return icons[category] || icons.default;
};

/**
 * Create a custom HTML element for Advanced Marker
 */
export const createMarkerElement = (data, type = 'attraction') => {
  const div = document.createElement('div');
  div.className = 'advanced-marker-container';
  
  const { name, rating, price, imageUrl, category } = data;
  const categoryColor = getCategoryColor(category || type);
  const icon = getCategoryIcon(category || type);
  
  div.innerHTML = `
    <div class="marker-content" style="
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      overflow: hidden;
      min-width: 120px;
      max-width: 200px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      ${imageUrl ? `
        <div style="
          width: 100%;
          height: 80px;
          background-image: url('${imageUrl}');
          background-size: cover;
          background-position: center;
        "></div>
      ` : ''}
      <div style="padding: 8px;">
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        ">
          <span style="font-size: 16px;">${icon}</span>
          <span style="
            font-weight: 600;
            font-size: 12px;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          ">${name || 'Location'}</span>
        </div>
        ${rating ? `
          <div style="
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            color: #666;
            margin-bottom: 2px;
          ">
            <span style="color: #FFA500;">⭐</span>
            <span>${rating.toFixed(1)}</span>
          </div>
        ` : ''}
        ${price !== undefined && price !== null ? `
          <div style="
            font-size: 11px;
            color: #34A853;
            font-weight: 600;
          ">₹${price}</div>
        ` : ''}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
        margin: 0 auto;
      "></div>
    </div>
  `;
  
  // Add hover effect
  div.style.cursor = 'pointer';
  div.addEventListener('mouseenter', () => {
    div.style.transform = 'scale(1.05)';
    div.style.transition = 'transform 0.2s';
  });
  div.addEventListener('mouseleave', () => {
    div.style.transform = 'scale(1)';
  });
  
  return div;
};

/**
 * Create a simple pin marker element
 */
export const createPinMarker = (data, type = 'attraction') => {
  const div = document.createElement('div');
  div.className = 'advanced-marker-pin';
  
  const { name, rating, category } = data;
  const categoryColor = getCategoryColor(category || type);
  const icon = getCategoryIcon(category || type);
  
  div.innerHTML = `
    <div style="
      background: ${categoryColor};
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 3px solid white;
      cursor: pointer;
    " title="${name || 'Location'}">
      ${icon}
    </div>
  `;
  
  // Add hover effect
  div.addEventListener('mouseenter', () => {
    div.style.transform = 'scale(1.2)';
    div.style.transition = 'transform 0.2s';
  });
  div.addEventListener('mouseleave', () => {
    div.style.transform = 'scale(1)';
  });
  
  return div;
};

/**
 * Initialize Advanced Markers library
 */
export const initAdvancedMarkers = async () => {
  if (window.google && window.google.maps) {
    try {
      const { AdvancedMarkerElement } = await window.google.maps.importLibrary('marker');
      return AdvancedMarkerElement;
    } catch (error) {
      console.error('Failed to load Advanced Markers library:', error);
      return null;
    }
  }
  return null;
};

/**
 * Create Advanced Marker with pin configuration
 */
export const createAdvancedMarkerPin = (map, position, options = {}) => {
  const {
    title,
    category = 'default',
    color,
    icon,
    onClick
  } = options;
  
  const pinColor = color || getCategoryColor(category);
  const pinIcon = icon || getCategoryIcon(category);
  
  // Create pin element
  const pinElement = document.createElement('div');
  pinElement.innerHTML = `
    <div style="
      background: ${pinColor};
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      border: 3px solid white;
      cursor: pointer;
    " title="${title || ''}">
      ${pinIcon}
    </div>
  `;
  
  if (onClick) {
    pinElement.addEventListener('click', onClick);
  }
  
  return {
    map,
    position,
    content: pinElement,
    title: title || ''
  };
};

