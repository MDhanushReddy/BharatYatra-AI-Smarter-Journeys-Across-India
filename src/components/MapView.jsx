import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const MapView = ({ attractions, center, onAttractionSelect, selectedAttractions }) => {
  // Convert coordinates object to array format for react-leaflet
  const coordsToArray = (coords) => {
    if (!coords) return null;
    if (Array.isArray(coords)) return coords;
    return coords.lat && coords.lng ? [coords.lat, coords.lng] : null;
  };

  if (!center) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Map location not available</p>
      </div>
    );
  }

  const mapCenter = coordsToArray(center) || [20.5937, 78.9629]; // Default to center of India

  return (
    <div className="h-96 rounded-lg overflow-hidden mb-8">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {attractions.map((attraction) => {
          const coords = coordsToArray(attraction.coordinates);
          return coords && (
            <Marker
              key={attraction.id}
              position={coords}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold mb-2">{attraction.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{attraction.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">₹{attraction.price}</span>
                    <button
                      onClick={() => onAttractionSelect(attraction)}
                      className={`px-3 py-1 rounded text-xs font-medium ${
                        selectedAttractions.some(a => a.id === attraction.id)
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {selectedAttractions.some(a => a.id === attraction.id)
                        ? 'Remove'
                        : 'Add to Plan'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapView; 