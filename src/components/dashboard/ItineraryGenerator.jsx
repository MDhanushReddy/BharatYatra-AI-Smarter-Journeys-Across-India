import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useTripPlanning } from '../../context/TripPlanningContext';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, LoadScript, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import AdvancedMarker from '../AdvancedMarker';

// Constants - moved outside component to prevent re-creation
const GOOGLE_MAPS_LIBRARIES = ['marker']; // Static array for LoadScript
import { exportItineraryAsPDF, downloadItineraryAsText, shareItineraryViaEmail, shareItineraryViaSocial, copyItineraryLink } from '../../utils/itineraryExport';
import { saveItinerary } from '../../services/api';
import { useNotification } from '../ui/NotificationSystem';
import EmptyState from '../ui/EmptyState';

const ItineraryGenerator = () => {
  const {
    tripDetails,
    selectedAttractions,
    selectedRestaurants,
    selectedAccommodations,
    generatedItinerary,
    updateGeneratedItinerary,
    coordsToArray
  } = useTripPlanning();

  const navigate = useNavigate();
  const { success, showError } = useNotification();
  const [itinerary, setItinerary] = useState([]);
  const [optimizationPreference, setOptimizationPreference] = useState('distance');
  const [generationStatus, setGenerationStatus] = useState('idle');
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India center coordinates
  const [isSaving, setIsSaving] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [optimizedRoutes, setOptimizedRoutes] = useState({}); // Store optimized routes per day
  const [routePolylines, setRoutePolylines] = useState({}); // Store route polylines for map
  const [isMapLoaded, setIsMapLoaded] = useState(false); // Track if Google Maps API is loaded
  const [advancedMarkersAvailable, setAdvancedMarkersAvailable] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = React.useRef([]);

  // Optimize routes for each day
  const optimizeRoutes = async (itineraryData) => {
    if (import.meta.env.DEV) {
      console.log('🔄 Starting route optimization...');
    }
    
    if (!selectedAccommodations || selectedAccommodations.length === 0) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ No accommodation selected, skipping route optimization');
      }
      return;
    }

    const accommodation = selectedAccommodations[0];
    const accommodationCoords = coordsToArray(accommodation.coordinates);
    
    if (!accommodationCoords || accommodationCoords.length !== 2) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ Invalid accommodation coordinates, skipping route optimization');
      }
      return;
    }

    // Validate accommodation coordinates are not Chennai default unless destination is Chennai
    const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
    const isChennaiCoords = Math.abs(accommodationCoords[0] - 13.0827) < 0.01 && Math.abs(accommodationCoords[1] - 80.2707) < 0.01;
    if (isChennaiCoords && !isChennai) {
      console.error('❌ Accommodation has Chennai default coordinates but destination is not Chennai');
      return;
    }

    try {
      // Optimize routes for each day
      const routePromises = itineraryData.map(async (day, dayIndex) => {
        if (!day.activities || day.activities.length === 0) {
          return { dayIndex, route: null };
        }

        const attractions = day.activities.map(activity => {
          const coords = coordsToArray(activity.coordinates);
          return {
            id: activity.id || activity.name,
            name: activity.name,
            coordinates: coords
          };
        }).filter(attr => attr.coordinates && attr.coordinates.length === 2);

        if (attractions.length === 0) {
          if (import.meta.env.DEV) {
            console.warn(`Day ${dayIndex + 1}: No valid attractions with coordinates`);
          }
          return { dayIndex, route: null };
        }

        try {
          const response = await fetch('/api/routes/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attractions: attractions,
              accommodation: {
                name: accommodation.name || 'Accommodation',
                coordinates: accommodationCoords
              },
              optimizationType: optimizationPreference || 'time'
            })
          });

          if (response.ok) {
            const routeData = await response.json();
            if (import.meta.env.DEV) {
              console.log(`✅ Day ${dayIndex + 1} route optimized:`, routeData.data ? routeData.data.route?.length : 0, 'segments');
            }
            return { dayIndex, route: routeData.data || routeData };
          } else {
            const errorText = await response.text();
            console.error(`❌ Route optimization failed for day ${dayIndex + 1}:`, response.status);
            return { dayIndex, route: null };
          }
        } catch (error) {
          console.error(`❌ Error optimizing route for day ${dayIndex + 1}:`, error.message);
          return { dayIndex, route: null };
        }
      });

      const results = await Promise.all(routePromises);
      
      // Store optimized routes
      const routesMap = {};
      const polylinesMap = {};
      
      results.forEach(({ dayIndex, route }) => {
        if (route && route.route && Array.isArray(route.route) && route.route.length > 0) {
          routesMap[dayIndex] = route;
          
          // Build polyline path for map - connect all points in sequence
          const path = [];
          
          // Start from accommodation (validate it's not Chennai unless destination is Chennai)
          const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
          const isAccommodationChennai = Math.abs(accommodationCoords[0] - 13.0827) < 0.01 && Math.abs(accommodationCoords[1] - 80.2707) < 0.01;
          if (!isAccommodationChennai || isChennai) {
            path.push({ lat: accommodationCoords[0], lng: accommodationCoords[1] });
          } else {
            if (import.meta.env.DEV) {
              console.error('❌ Accommodation coordinates are Chennai default but destination is not Chennai - skipping route');
            }
            return;
          }
          
          // Add optimized route points in order (from -> to)
          route.route.forEach((segment) => {
            // Add 'from' coordinate if available and not already added
            if (segment.from && segment.from.coordinates) {
              const fromCoords = segment.from.coordinates;
              if (Array.isArray(fromCoords) && fromCoords.length === 2 && 
                  !isNaN(fromCoords[0]) && !isNaN(fromCoords[1]) &&
                  fromCoords[0] >= -90 && fromCoords[0] <= 90 &&
                  fromCoords[1] >= -180 && fromCoords[1] <= 180) {
                const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
                const isChennaiCoords = Math.abs(fromCoords[0] - 13.0827) < 0.01 && Math.abs(fromCoords[1] - 80.2707) < 0.01;
                if ((!isChennaiCoords || isChennai)) {
                  const lastPoint = path[path.length - 1];
                  if (!lastPoint || lastPoint.lat !== fromCoords[0] || lastPoint.lng !== fromCoords[1]) {
                    path.push({ lat: fromCoords[0], lng: fromCoords[1] });
                  }
                }
              }
            }
            
            // Add 'to' coordinate (destination)
            if (segment.to && segment.to.coordinates) {
              const toCoords = segment.to.coordinates;
              if (Array.isArray(toCoords) && toCoords.length === 2 && 
                  !isNaN(toCoords[0]) && !isNaN(toCoords[1]) &&
                  toCoords[0] >= -90 && toCoords[0] <= 90 &&
                  toCoords[1] >= -180 && toCoords[1] <= 180) {
                const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
                const isChennaiCoords = Math.abs(toCoords[0] - 13.0827) < 0.01 && Math.abs(toCoords[1] - 80.2707) < 0.01;
                if (!isChennaiCoords || isChennai) {
                  path.push({ lat: toCoords[0], lng: toCoords[1] });
                }
              }
            } else if (segment.attraction && segment.attraction.coordinates) {
              const attrCoords = segment.attraction.coordinates;
              if (Array.isArray(attrCoords) && attrCoords.length === 2 && 
                  !isNaN(attrCoords[0]) && !isNaN(attrCoords[1]) &&
                  attrCoords[0] >= -90 && attrCoords[0] <= 90 &&
                  attrCoords[1] >= -180 && attrCoords[1] <= 180) {
                const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
                const isChennaiCoords = Math.abs(attrCoords[0] - 13.0827) < 0.01 && Math.abs(attrCoords[1] - 80.2707) < 0.01;
                if (!isChennaiCoords || isChennai) {
                  path.push({ lat: attrCoords[0], lng: attrCoords[1] });
                }
              }
            }
          });
          
          // Return to accommodation at the end
          if (route.route.length > 0) {
            const lastPoint = path[path.length - 1];
            const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
            const isAccommodationChennai = Math.abs(accommodationCoords[0] - 13.0827) < 0.01 && Math.abs(accommodationCoords[1] - 80.2707) < 0.01;
            if ((!lastPoint || lastPoint.lat !== accommodationCoords[0] || lastPoint.lng !== accommodationCoords[1]) && (!isAccommodationChennai || isChennai)) {
              path.push({ lat: accommodationCoords[0], lng: accommodationCoords[1] });
            }
          }
          
          if (path.length > 1) {
            polylinesMap[dayIndex] = path;
            if (import.meta.env.DEV) {
              console.log(`✅ Day ${dayIndex + 1} route path: ${path.length} points`);
            }
          }
        }
      });

      setOptimizedRoutes(routesMap);
      setRoutePolylines(polylinesMap);
      
      if (import.meta.env.DEV) {
        console.log('✅ Route optimization complete:', Object.keys(routesMap).length, 'days optimized');
      }
    } catch (error) {
      console.error('❌ Error optimizing routes:', error);
    }
  };

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareMenu && !event.target.closest('.relative')) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showShareMenu]);

  // Redirect if trip details are missing or incomplete
  useEffect(() => {
    if (!tripDetails || !tripDetails.destination || !tripDetails.startDate || !tripDetails.endDate) {
      navigate('/plan');
    }
  }, [tripDetails, navigate]);

  useEffect(() => {
    if (tripDetails && tripDetails.destination && tripDetails.startDate && tripDetails.endDate) {
      // Generate itinerary even if no attractions selected (will use accommodations/restaurants)
      if (selectedAttractions.length > 0 || selectedRestaurants.length > 0 || selectedAccommodations.length > 0) {
        generateInitialItinerary();
        // Set map center to first attraction's coordinates, or accommodation, or destination if available
        // Filter out Chennai default coordinates unless destination is Chennai
        const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
        const firstAttractionCoords = coordsToArray(selectedAttractions[0]?.coordinates);
        const accommodationCoords = selectedAccommodations.length > 0 ? coordsToArray(selectedAccommodations[0]?.coordinates) : null;
        
        // Check if coordinates are Chennai default
        const isFirstAttractionChennai = firstAttractionCoords && 
          Math.abs(firstAttractionCoords[0] - 13.0827) < 0.01 && 
          Math.abs(firstAttractionCoords[1] - 80.2707) < 0.01;
        const isAccommodationChennai = accommodationCoords && 
          Math.abs(accommodationCoords[0] - 13.0827) < 0.01 && 
          Math.abs(accommodationCoords[1] - 80.2707) < 0.01;
        
        if (firstAttractionCoords && firstAttractionCoords.length === 2 && (!isFirstAttractionChennai || isChennai)) {
          setMapCenter([firstAttractionCoords[0], firstAttractionCoords[1]]);
        } else if (accommodationCoords && accommodationCoords.length === 2 && (!isAccommodationChennai || isChennai)) {
          setMapCenter([accommodationCoords[0], accommodationCoords[1]]);
        } else if (tripDetails.coordinates) {
          // Use destination coordinates if available
          const destCoords = coordsToArray(tripDetails.coordinates);
          if (destCoords && destCoords.length === 2) {
            setMapCenter([destCoords[0], destCoords[1]]);
          } else {
            // Default to India center if no valid coordinates
            setMapCenter([20.5937, 78.9629]);
          }
        } else {
          // Default to India center if no coordinates
          setMapCenter([20.5937, 78.9629]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripDetails, selectedAttractions, selectedRestaurants, selectedAccommodations]);

  // Save generated itinerary to context
  useEffect(() => {
    if (itinerary.length > 0) {
      updateGeneratedItinerary(itinerary);
    }
  }, [itinerary, updateGeneratedItinerary]);

  // Debug: Log when route polylines change (only in development and when values actually change)
  useEffect(() => {
    if (import.meta.env.DEV && Object.keys(routePolylines).length > 0) {
      console.log('🔵 Route polylines updated:', Object.keys(routePolylines).length, 'days');
    }
  }, [routePolylines]);

  const generateInitialItinerary = () => {
    if (!tripDetails || !tripDetails.startDate || !tripDetails.endDate) {
      console.error('Trip details are missing');
      return;
    }

    setGenerationStatus('generating');
    
    try {
      // Calculate number of days from trip dates
      const startDate = new Date(tripDetails.startDate);
      const endDate = new Date(tripDetails.endDate);
      const numberOfDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      if (numberOfDays <= 0) {
        throw new Error('Invalid date range');
      }

      // Generate day-wise itinerary
      const newItinerary = Array.from({ length: numberOfDays }, (_, dayIndex) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + dayIndex);

        return {
          date: currentDate.toISOString().split('T')[0],
          activities: [],
          meals: {
            breakfast: null,
            lunch: null,
            dinner: null
          },
          transportation: []
        };
      });

      // Distribute attractions across days
      const attractionsPerDay = Math.ceil(selectedAttractions.length / numberOfDays);
      selectedAttractions.forEach((attraction, index) => {
        const dayIndex = Math.floor(index / attractionsPerDay);
        if (dayIndex < newItinerary.length) {
          newItinerary[dayIndex].activities.push({
            ...attraction,
            coordinates: coordsToArray(attraction.coordinates),
            startTime: '09:00',
            endTime: '11:00'
          });
        }
      });

      // Add restaurants to each day
      if (selectedRestaurants.length > 0) {
        newItinerary.forEach((day, index) => {
          const restaurantIndex = index % selectedRestaurants.length;
          day.meals.lunch = {
            ...selectedRestaurants[restaurantIndex],
            coordinates: coordsToArray(selectedRestaurants[restaurantIndex].coordinates),
            startTime: '13:00',
            endTime: '14:00'
          };
        });
      }

      // Add selected accommodation to itinerary
      if (selectedAccommodations.length > 0) {
        const selectedAccommodation = selectedAccommodations[0]; // Use first selected accommodation
        newItinerary.forEach((day) => {
          day.accommodation = {
            ...selectedAccommodation,
            coordinates: coordsToArray(selectedAccommodation.coordinates),
            checkIn: day.date === newItinerary[0].date ? tripDetails.startDate : null,
            checkOut: day.date === newItinerary[newItinerary.length - 1].date ? tripDetails.endDate : null
          };
        });
      }

      setItinerary(newItinerary);
      setGenerationStatus('complete');
      
      // Create basic route paths immediately for fallback display
      // Works with or without accommodations - just connects attractions in order
      const basicPolylines = {};
      newItinerary.forEach((day, dayIndex) => {
        if (day.activities && day.activities.length > 0) {
          const path = [];
          const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
          
          // Start from accommodation if available and valid
          if (selectedAccommodations.length > 0) {
            const accommodationCoords = coordsToArray(selectedAccommodations[0].coordinates);
            const isAccommodationChennai = accommodationCoords && 
              Math.abs(accommodationCoords[0] - 13.0827) < 0.01 && 
              Math.abs(accommodationCoords[1] - 80.2707) < 0.01;
            
            if (accommodationCoords && accommodationCoords.length === 2 && (!isAccommodationChennai || isChennai)) {
              path.push({ lat: accommodationCoords[0], lng: accommodationCoords[1] });
            }
          }
          
          // Add all attraction coordinates for this day
          day.activities.forEach(activity => {
            const coords = coordsToArray(activity.coordinates);
            if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
              // Filter out Chennai coordinates if destination is not Chennai
              const isChennaiCoords = Math.abs(coords[0] - 13.0827) < 0.01 && Math.abs(coords[1] - 80.2707) < 0.01;
              if (!isChennaiCoords || isChennai) {
                path.push({ lat: coords[0], lng: coords[1] });
              }
            }
          });
          
          // Return to accommodation at the end if available and valid
          if (selectedAccommodations.length > 0) {
            const accommodationCoords = coordsToArray(selectedAccommodations[0].coordinates);
            const isAccommodationChennai = accommodationCoords && 
              Math.abs(accommodationCoords[0] - 13.0827) < 0.01 && 
              Math.abs(accommodationCoords[1] - 80.2707) < 0.01;
            
            if (accommodationCoords && accommodationCoords.length === 2 && (!isAccommodationChennai || isChennai)) {
              const lastPoint = path[path.length - 1];
              if (!lastPoint || lastPoint.lat !== accommodationCoords[0] || lastPoint.lng !== accommodationCoords[1]) {
                path.push({ lat: accommodationCoords[0], lng: accommodationCoords[1] });
              }
            }
          }
          
          if (path.length > 1) {
            basicPolylines[dayIndex] = path;
          }
        }
      });
      
      if (Object.keys(basicPolylines).length > 0) {
        setRoutePolylines(basicPolylines);
        if (import.meta.env.DEV) {
          console.log('✅ Basic route polylines created:', Object.keys(basicPolylines).length, 'days');
        }
      }
      
      // Optimize routes after itinerary is generated (with delay to ensure state is set)
      // Only optimize if we have both accommodations and attractions
      if (selectedAccommodations.length > 0 && selectedAttractions.length > 0) {
        setTimeout(() => {
          optimizeRoutes(newItinerary);
        }, 500);
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setGenerationStatus('error');
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const newItinerary = [...itinerary];
    const [removed] = newItinerary[source.droppableId].activities.splice(source.index, 1);
    newItinerary[destination.droppableId].activities.splice(destination.index, 0, removed);

    setItinerary(newItinerary);
  };

  // Show loading state if trip details are being validated
  if (!tripDetails || !tripDetails.destination || !tripDetails.startDate || !tripDetails.endDate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading trip details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (generationStatus === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Itinerary</h2>
          <p className="text-gray-600 mb-6">There was an error generating your itinerary. Please try again.</p>
          <button
            onClick={() => {
              setGenerationStatus('idle');
              if (tripDetails && selectedAttractions.length > 0) {
                generateInitialItinerary();
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show empty state if no attractions, restaurants, or accommodations selected
  if (selectedAttractions.length === 0 && selectedRestaurants.length === 0 && selectedAccommodations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <EmptyState
          icon="🗺️"
          title="No Items Selected"
          description="Please select some attractions, restaurants, or accommodations from the Dashboard to generate your itinerary."
          actionLabel="Go to Dashboard"
          onAction={() => navigate('/dashboard')}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-primary">Your Itinerary</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={async () => {
              setIsSaving(true);
              try {
                await saveItinerary(itinerary, tripDetails);
                success('Itinerary saved successfully!', { title: 'Saved' });
              } catch (error) {
                showError('Failed to save itinerary. Please try again.', { title: 'Error' });
              } finally {
                setIsSaving(false);
              }
            }}
            disabled={isSaving}
            className="travel-button text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save Itinerary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="travel-button-secondary text-sm"
              title="Share Itinerary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </button>
            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button
                  onClick={() => {
                    shareItineraryViaEmail(itinerary, tripDetails);
                    setShowShareMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  📧 Email
                </button>
                <button
                  onClick={() => {
                    shareItineraryViaSocial(itinerary, tripDetails, 'twitter');
                    setShowShareMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  🐦 Twitter
                </button>
                <button
                  onClick={() => {
                    shareItineraryViaSocial(itinerary, tripDetails, 'facebook');
                    setShowShareMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  📘 Facebook
                </button>
                <button
                  onClick={() => {
                    shareItineraryViaSocial(itinerary, tripDetails, 'whatsapp');
                    setShowShareMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={async () => {
                    const copied = await copyItineraryLink();
                    if (copied) {
                      success('Link copied to clipboard!', { title: 'Copied' });
                    } else {
                      showError('Failed to copy link', { title: 'Error' });
                    }
                    setShowShareMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  🔗 Copy Link
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => exportItineraryAsPDF(itinerary, tripDetails)}
            className="travel-button text-sm px-4 py-2 flex items-center gap-2"
            title="Print or Save as PDF"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print/PDF
          </button>
          <button
            onClick={() => downloadItineraryAsText(itinerary, tripDetails)}
            className="travel-pill text-sm px-4 py-2 flex items-center gap-2 bg-misty text-earth"
            title="Download as Text File"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            {itinerary.map((day, dayIndex) => (
              <Droppable key={dayIndex} droppableId={dayIndex.toString()}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="mb-6 p-4 bg-gray-50 rounded-lg"
                  >
                    <h3 className="text-lg font-semibold mb-3">
                      Day {dayIndex + 1} - {new Date(day.date).toLocaleDateString()}
                    </h3>
                    {day.activities.map((activity, index) => (
                      <Draggable
                        key={activity.id}
                        draggableId={`${activity.id}-${dayIndex}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="bg-white p-3 mb-2 rounded shadow-sm"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{activity.name}</span>
                              <span className="text-sm text-gray-500">
                                {activity.startTime} - {activity.endTime}
                              </span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </DragDropContext>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-2xl font-bold mb-4">Map View</h2>
          <div className="h-[600px]">
            {(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY) ? (
              <LoadScript 
                googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.REACT_APP_GOOGLE_MAPS_API_KEY}
                libraries={GOOGLE_MAPS_LIBRARIES}
                onLoad={() => {
                  setIsMapLoaded(true);
                }}
                onError={(error) => {
                  console.error('❌ Google Maps API load error:', error);
                }}
              >
                <GoogleMap
                mapContainerStyle={{ height: '100%', width: '100%' }}
                center={mapCenter.length === 2 ? { lat: mapCenter[0], lng: mapCenter[1] } : { lat: 20.5937, lng: 78.9629 }}
                zoom={selectedAttractions.length > 0 || selectedAccommodations.length > 0 ? 13 : 5}
                options={{
                  mapTypeControl: true,
                  streetViewControl: false,
                  fullscreenControl: true,
                  zoomControl: true,
                  mapId: "DEMO_MAP_ID" // Required for Advanced Markers
                }}
                onLoad={(map) => {
                  setIsMapLoaded(true);
                  setMapInstance(map);
                  
                  // Check if Advanced Markers are available
                  if (window.google) {
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
                }}
              >
                {/* Show accommodation marker if selected */}
                {selectedAccommodations.length > 0 && isMapLoaded && mapInstance && (() => {
                  const accCoords = coordsToArray(selectedAccommodations[0].coordinates);
                  if (accCoords && accCoords.length === 2) {
                    if (advancedMarkersAvailable) {
                      return (
                        <AdvancedMarker
                          key="accommodation"
                          map={mapInstance}
                          position={{ lat: accCoords[0], lng: accCoords[1] }}
                          data={selectedAccommodations[0]}
                          category="accommodation"
                          onClick={() => setSelectedMarker({ 
                            activity: selectedAccommodations[0], 
                            dayIndex: -1, 
                            coords: accCoords,
                            type: 'accommodation'
                          })}
                          markersRef={markersRef}
                        />
                      );
                    }
                    return (
                      <Marker
                        key="accommodation"
                        position={{ lat: accCoords[0], lng: accCoords[1] }}
                        icon={{
                          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                          scaledSize: new window.google.maps.Size(32, 32)
                        }}
                        label={{
                          text: '🏠',
                          fontSize: '20px'
                        }}
                        onClick={() => setSelectedMarker({ 
                          activity: selectedAccommodations[0], 
                          dayIndex: -1, 
                          coords: accCoords,
                          type: 'accommodation'
                        })}
                      />
                    );
                  }
                  return null;
                })()}
                
                {/* Show attraction markers */}
                {itinerary.map((day, dayIndex) =>
                  day.activities.map((activity) => {
                    const coords = coordsToArray(activity.coordinates);
                    if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]) && mapInstance) {
                      if (advancedMarkersAvailable) {
                        return (
                          <AdvancedMarker
                            key={`${activity.id}-${dayIndex}`}
                            map={mapInstance}
                            position={{ lat: coords[0], lng: coords[1] }}
                            data={activity}
                            category={activity.category || 'attraction'}
                            dayNumber={dayIndex + 1}
                            onClick={() => setSelectedMarker({ activity, dayIndex, coords, type: 'attraction' })}
                            markersRef={markersRef}
                          />
                        );
                      }
                      return (
                        <Marker
                          key={`${activity.id}-${dayIndex}`}
                          position={{ lat: coords[0], lng: coords[1] }}
                          label={{
                            text: `${dayIndex + 1}`,
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}
                          onClick={() => setSelectedMarker({ activity, dayIndex, coords, type: 'attraction' })}
                        />
                      );
                    }
                    return null;
                  })
                )}
                
                {selectedMarker && (
                  <InfoWindow
                    position={{ lat: selectedMarker.coords[0], lng: selectedMarker.coords[1] }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div>
                      <h3 className="font-bold">
                        {selectedMarker.type === 'accommodation' ? '🏠 ' : ''}
                        {selectedMarker.activity.name}
                      </h3>
                      {selectedMarker.type === 'accommodation' ? (
                        <p className="text-sm text-gray-600">Your Accommodation</p>
                      ) : (
                        <>
                          <p className="text-sm">Day {selectedMarker.dayIndex + 1}</p>
                          <p className="text-sm">{selectedMarker.activity.startTime} - {selectedMarker.activity.endTime}</p>
                        </>
                      )}
                      {selectedMarker.type === 'attraction' && optimizedRoutes[selectedMarker.dayIndex] && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-green-600 font-medium">
                            ✓ Optimized Route Applied
                          </p>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}
                
                {/* Draw optimized route polylines for each day */}
                {isMapLoaded && window.google && window.google.maps && Object.entries(routePolylines).map(([dayIndexStr, path]) => {
                  const dayIndex = parseInt(dayIndexStr, 10);
                  
                  if (path && Array.isArray(path) && path.length > 1) {
                    // Reduced logging - only log in development mode
                    if (import.meta.env.DEV) {
                      console.log(`🎨 Drawing route for day ${dayIndex}:`, path.length, 'points');
                    }
                    
                    // Convert path to Google Maps LatLng objects or {lat, lng} format
                    // Filter out invalid coordinates (including Chennai default if destination is not Chennai)
                    const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
                    const googlePath = path
                      .filter(point => {
                        if (typeof point === 'object' && point !== null) {
                          if (point.lat !== undefined && point.lng !== undefined) {
                            const lat = Number(point.lat);
                            const lng = Number(point.lng);
                            // Validate coordinates are within valid ranges
                            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                              return false;
                            }
                            // Filter out Chennai default coordinates if destination is not Chennai
                            const isChennaiCoords = Math.abs(lat - 13.0827) < 0.01 && Math.abs(lng - 80.2707) < 0.01;
                            if (isChennaiCoords && !isChennai) {
                              console.warn(`⚠️ Filtered out Chennai default coordinates for non-Chennai destination`);
                              return false;
                            }
                            return true;
                          }
                        }
                        return false;
                      })
                      .map(point => {
                        if (typeof point === 'object' && point !== null) {
                          if (point.lat !== undefined && point.lng !== undefined) {
                            const lat = Number(point.lat);
                            const lng = Number(point.lng);
                            if (!isNaN(lat) && !isNaN(lng)) {
                              // Use LatLng objects for better compatibility
                              if (window.google && window.google.maps && window.google.maps.LatLng) {
                                return new window.google.maps.LatLng(lat, lng);
                              }
                              return { lat, lng };
                            }
                          } else if (Array.isArray(point) && point.length === 2) {
                            const lat = Number(point[0]);
                            const lng = Number(point[1]);
                            // Validate coordinates are within valid ranges
                            if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                              return null;
                            }
                            // Filter out Chennai default coordinates if destination is not Chennai
                            const isChennaiCoords = Math.abs(lat - 13.0827) < 0.01 && Math.abs(lng - 80.2707) < 0.01;
                            if (isChennaiCoords && !isChennai) {
                              console.warn(`⚠️ Filtered out Chennai default coordinates for non-Chennai destination`);
                              return null;
                            }
                            if (!isNaN(lat) && !isNaN(lng)) {
                              if (window.google && window.google.maps && window.google.maps.LatLng) {
                                return new window.google.maps.LatLng(lat, lng);
                              }
                              return { lat, lng };
                            }
                          }
                        }
                        return null;
                      })
                      .filter(point => point !== null);
                    
                    if (googlePath.length < 2) {
                      if (import.meta.env.DEV) {
                        console.warn(`⚠️ Day ${dayIndex}: Invalid path format, only ${googlePath.length} valid points`);
                      }
                      return null;
                    }
                    
                    // Reduced logging - only log in development mode
                    if (import.meta.env.DEV) {
                      console.log(`✅ Day ${dayIndex}: Drawing polyline with ${googlePath.length} points`);
                    }
                    
                    return (
                      <Polyline
                        key={`route-optimized-day-${dayIndex}`}
                        path={googlePath}
                        options={{
                          strokeColor: '#2563EB', // Bright blue
                          strokeWeight: 6,
                          strokeOpacity: 0.9,
                          geodesic: true, // Use curved lines following roads
                          zIndex: 1000,
                          clickable: false,
                          draggable: false,
                          editable: false,
                          visible: true
                        }}
                        onLoad={(polyline) => {
                          console.log(`✅ Polyline loaded for day ${dayIndex}`, polyline);
                          if (polyline && polyline.getPath) {
                            const path = polyline.getPath();
                            console.log(`   Polyline path length:`, path ? path.getLength() : 'N/A');
                            console.log(`   Polyline visible:`, polyline.getVisible ? polyline.getVisible() : 'N/A');
                          }
                        }}
                        onUnmount={(polyline) => {
                          console.log(`🗑️ Polyline unmounted for day ${dayIndex}`);
                        }}
                      />
                    );
                  }
                  return null;
                })}
                
                {/* Draw route lines for each day - connecting attractions in order (fallback if no optimized route) */}
                {isMapLoaded && itinerary.map((day, dayIndex) => {
                  // Skip if optimized route already exists for this day
                  if (routePolylines[dayIndex]) {
                    return null;
                  }
                  
                  const dayCoords = [];
                  const isChennai = tripDetails?.destination?.toLowerCase().includes('chennai');
                  
                  // Start from accommodation if available (optional)
                  if (selectedAccommodations.length > 0 && day.activities.length > 0) {
                    const accCoords = coordsToArray(selectedAccommodations[0].coordinates);
                    if (accCoords && accCoords.length === 2) {
                      // Filter out Chennai coordinates if destination is not Chennai
                      const isAccommodationChennai = Math.abs(accCoords[0] - 13.0827) < 0.01 && Math.abs(accCoords[1] - 80.2707) < 0.01;
                      if (!isAccommodationChennai || isChennai) {
                        dayCoords.push({ lat: accCoords[0], lng: accCoords[1] });
                      }
                    }
                  }
                  
                  // Add all attraction coordinates for this day in order
                  day.activities.forEach(activity => {
                    const coords = coordsToArray(activity.coordinates);
                    if (coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                      // Filter out Chennai coordinates if destination is not Chennai
                      const isChennaiCoords = Math.abs(coords[0] - 13.0827) < 0.01 && Math.abs(coords[1] - 80.2707) < 0.01;
                      if (!isChennaiCoords || isChennai) {
                        dayCoords.push({ lat: coords[0], lng: coords[1] });
                      }
                    }
                  });
                  
                  // Return to accommodation at the end if available (optional)
                  if (selectedAccommodations.length > 0 && dayCoords.length > 1) {
                    const accCoords = coordsToArray(selectedAccommodations[0].coordinates);
                    if (accCoords && accCoords.length === 2) {
                      const isAccommodationChennai = Math.abs(accCoords[0] - 13.0827) < 0.01 && Math.abs(accCoords[1] - 80.2707) < 0.01;
                      if (!isAccommodationChennai || isChennai) {
                        const lastCoord = dayCoords[dayCoords.length - 1];
                        // Only add if different from last point
                        if (lastCoord.lat !== accCoords[0] || lastCoord.lng !== accCoords[1]) {
                          dayCoords.push({ lat: accCoords[0], lng: accCoords[1] });
                        }
                      }
                    }
                  }
                  
                  // Even without accommodation, we should draw lines between attractions
                  if (dayCoords.length < 2 && day.activities.length > 1) {
                    console.warn(`⚠️ Day ${dayIndex + 1}: Not enough valid coordinates for route (${dayCoords.length} points, ${day.activities.length} activities)`);
                  }
                  
                  if (dayCoords.length > 1) {
                    console.log(`🎨 Drawing blue route line for day ${dayIndex + 1}:`, dayCoords.length, 'points');
                    return (
                      <Polyline
                        key={`route-day-${dayIndex}`}
                        path={dayCoords}
                        options={{
                          strokeColor: '#3B82F6', // Blue-500
                          strokeWeight: 4,
                          strokeOpacity: 0.7,
                          geodesic: true, // Curved lines
                          zIndex: 500
                        }}
                        visible={true}
                      />
                    );
                  }
                  return null;
                })}
              </GoogleMap>
              </LoadScript>
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center p-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="text-gray-600 font-medium">Google Maps API key not configured</p>
                  <p className="text-gray-500 text-sm mt-2">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryGenerator; 