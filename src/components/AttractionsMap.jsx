import React, { useEffect, useState, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { attractionsData, getAttractionLocation, getNearbyAttractions } from '../data/attractionsData';
import AdvancedMarker from './AdvancedMarker';

// Constants - moved outside component to prevent re-creation
const GOOGLE_MAPS_LIBRARIES = ['marker']; // Static array for LoadScript

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const defaultCenter = {
  lat: 20.5937,
  lng: 78.9629
};

const AttractionsMap = ({ selectedCity, selectedAttraction, onAttractionSelect }) => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [nearbyAttractions, setNearbyAttractions] = useState([]);
  const [map, setMap] = useState(null);
  const [advancedMarkersAvailable, setAdvancedMarkersAvailable] = useState(false);
  const markersRef = useRef([]);

  useEffect(() => {
    if (selectedAttraction) {
      const nearby = getNearbyAttractions(selectedAttraction, 2);
      setNearbyAttractions(nearby);
    }
  }, [selectedAttraction]);

  // Check if Advanced Markers are available
  useEffect(() => {
    if (map && window.google) {
      window.google.maps.importLibrary('marker').then(() => {
        setAdvancedMarkersAvailable(true);
        if (import.meta.env.DEV) {
          console.log('✅ Advanced Markers library available');
        }
      }).catch(() => {
        if (import.meta.env.DEV) {
          console.log('⚠️ Advanced Markers not available, using classic markers');
        }
      });
    }
  }, [map]);

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker && marker.map) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    };
  }, []);

  const onLoad = (map) => {
    setMap(map);
  };

  const onUnmount = () => {
    setMap(null);
  };

  const handleMarkerClick = (attraction) => {
    setSelectedMarker(attraction);
    onAttractionSelect?.(attraction);
  };

  const getAttractionsForMap = () => {
    if (selectedCity) {
      return attractionsData[selectedCity]?.attractions || [];
    }
    return Object.values(attractionsData).flatMap(city => city.attractions);
  };

  return (
    <LoadScript 
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY || "AIzaSyBR7U052XVfS2P4sdB4EF18NBrGii0LTVk"}
      libraries={GOOGLE_MAPS_LIBRARIES}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={selectedAttraction ? getAttractionLocation(selectedAttraction) : defaultCenter}
        zoom={selectedCity ? 12 : 5}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          mapId: "DEMO_MAP_ID" // Required for Advanced Markers
        }}
      >
        {getAttractionsForMap().map((attraction) => {
          const position = getAttractionLocation(attraction);
          
          // Use Advanced Markers if available
          if (advancedMarkersAvailable && map) {
            return (
              <AdvancedMarker
                key={attraction.id}
                map={map}
                position={position}
                data={attraction}
                category={attraction.category}
                onClick={() => handleMarkerClick(attraction)}
                markersRef={markersRef}
              />
            );
          }
          
          // Fallback to classic markers
          return (
            <Marker
              key={attraction.id}
              position={position}
              onClick={() => handleMarkerClick(attraction)}
              icon={{
                url: getMarkerIcon(attraction.category),
                scaledSize: new window.google.maps.Size(30, 30)
              }}
            />
          );
        })}

        {selectedMarker && (
          <InfoWindow
            position={getAttractionLocation(selectedMarker)}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div className="p-2">
              <h3 className="font-bold">{selectedMarker.name}</h3>
              <p className="text-sm">{selectedMarker.description}</p>
              <div className="mt-2">
                <a
                  href={selectedMarker.location.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View on Google Maps
                </a>
              </div>
            </div>
          </InfoWindow>
        )}

        {nearbyAttractions.map((attraction) => {
          const position = getAttractionLocation(attraction);
          
          // Use Advanced Markers if available
          if (advancedMarkersAvailable && map) {
            return (
              <AdvancedMarker
                key={`nearby-${attraction.id}`}
                map={map}
                position={position}
                data={attraction}
                category={attraction.category}
                isNearby={true}
                markersRef={markersRef}
              />
            );
          }
          
          // Fallback to classic markers
          return (
            <Marker
              key={`nearby-${attraction.id}`}
              position={position}
              icon={{
                url: getMarkerIcon(attraction.category, true),
                scaledSize: new window.google.maps.Size(25, 25)
              }}
            />
          );
        })}
      </GoogleMap>
    </LoadScript>
  );
};

const getMarkerIcon = (category, isNearby = false) => {
  const baseUrl = "https://maps.google.com/mapfiles/ms/icons/";
  const colors = {
    monuments: "red",
    nature: "green",
    religious: "blue",
    heritage: "purple",
    wildlife: "orange",
    museums: "yellow",
    shopping: "pink",
    nightlife: "black",
    food: "brown",
    festivals: "cyan"
  };
  return `${baseUrl}${colors[category] || "red"}-dot${isNearby ? "-small" : ""}.png`;
};

export default AttractionsMap; 