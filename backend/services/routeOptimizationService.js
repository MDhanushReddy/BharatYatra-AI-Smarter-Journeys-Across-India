// Route Optimization Service using Dijkstra's Algorithm
import axios from 'axios';

class RouteOptimizationService {
  constructor() {
    this.graph = new Map();
    // Try multiple environment variable names for API key
    this.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || 
                            process.env.GOOGLE_PLACES_API_KEY ||
                            process.env.REACT_APP_GOOGLE_MAPS_API_KEY ||
                            process.env.VITE_GOOGLE_MAPS_API_KEY;
    
    console.log('RouteOptimizationService initialized');
    console.log('Google Maps API Key present:', !!this.googleMapsApiKey);
    console.log('API Key length:', this.googleMapsApiKey ? this.googleMapsApiKey.length : 0);
  }

  // Dijkstra's algorithm implementation for route optimization
  dijkstra(graph, start, end) {
    const distances = new Map();
    const previous = new Map();
    const visited = new Set();
    const queue = [];

    // Initialize distances
    for (const node of graph.keys()) {
      distances.set(node, Infinity);
      previous.set(node, null);
    }
    distances.set(start, 0);
    queue.push({ node: start, distance: 0 });

    while (queue.length > 0) {
      // Sort queue by distance
      queue.sort((a, b) => a.distance - b.distance);
      const { node: current, distance } = queue.shift();

      if (visited.has(current)) continue;
      visited.add(current);

      if (current === end) break;

      const neighbors = graph.get(current) || [];
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.node)) continue;

        const newDistance = distance + neighbor.weight;
        if (newDistance < distances.get(neighbor.node)) {
          distances.set(neighbor.node, newDistance);
          previous.set(neighbor.node, current);
          queue.push({ node: neighbor.node, distance: newDistance });
        }
      }
    }

    // Reconstruct path
    const path = [];
    let current = end;
    while (current !== null) {
      path.unshift(current);
      current = previous.get(current);
    }

    return {
      path: path,
      distance: distances.get(end),
      totalTime: distances.get(end)
    };
  }

  // Build graph from attractions and accommodation
  buildGraph(attractions, accommodation) {
    const graph = new Map();
    const nodes = [];

    // Add accommodation as starting point
    if (accommodation) {
      // Handle different accommodation formats
      let accCoords = null;
      if (accommodation.coordinates && Array.isArray(accommodation.coordinates)) {
        accCoords = accommodation.coordinates;
      } else if (accommodation.latitude && accommodation.longitude) {
        accCoords = [accommodation.latitude, accommodation.longitude];
      } else if (accommodation.lat && accommodation.lng) {
        accCoords = [accommodation.lat, accommodation.lng];
      }
      
      if (accCoords && accCoords.length === 2) {
        nodes.push({
          id: 'accommodation',
          name: accommodation.name || 'Accommodation',
          coordinates: accCoords,
          type: 'accommodation'
        });
      }
    }

    // Add attractions
    attractions.forEach((attraction, index) => {
      let attrCoords = null;
      if (attraction.coordinates && Array.isArray(attraction.coordinates)) {
        attrCoords = attraction.coordinates;
      } else if (attraction.latitude && attraction.longitude) {
        attrCoords = [attraction.latitude, attraction.longitude];
      } else if (attraction.lat && attraction.lng) {
        attrCoords = [attraction.lat, attraction.lng];
      }
      
      if (attrCoords && attrCoords.length === 2) {
        nodes.push({
          id: attraction.id || `attraction_${index}`,
          name: attraction.name || `Attraction ${index + 1}`,
          coordinates: attrCoords,
          type: 'attraction',
          duration: this.parseDuration(attraction.duration),
          rating: attraction.rating
        });
      }
    });

    // Build adjacency list with travel times as weights
    for (let i = 0; i < nodes.length; i++) {
      const neighbors = [];
      for (let j = 0; j < nodes.length; j++) {
        if (i !== j) {
          const distance = this.calculateDistance(nodes[i].coordinates, nodes[j].coordinates);
          const travelTime = this.estimateTravelTime(distance);
          neighbors.push({
            node: nodes[j].id, // Use actual node ID
            weight: travelTime,
            distance: distance
          });
        }
      }
      graph.set(nodes[i].id, neighbors); // Use actual node ID as key
    }

    return { graph, nodes };
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
    const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Estimate travel time based on distance (assuming average speed of 30 km/h in city)
  estimateTravelTime(distance) {
    return distance * 2; // 2 minutes per km in city traffic
  }

  // Parse duration string to hours
  parseDuration(duration) {
    if (typeof duration === 'string') {
      if (duration.includes('hour')) {
        const match = duration.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1;
      } else if (duration.includes('day')) {
        return 8; // Full day = 8 hours
      }
    }
    return 2; // Default 2 hours
  }

  // Get route from Google Maps Directions API
  async getGoogleMapsRoute(start, end) {
    try {
      if (!this.googleMapsApiKey) {
        console.warn('Google Maps API key not configured for Directions API');
        throw new Error('Google Maps API key not configured');
      }

      const origin = Array.isArray(start) ? `${start[0]},${start[1]}` : start;
      const destination = Array.isArray(end) ? `${end[0]},${end[1]}` : end;
      
      console.log('Getting Google Maps route:', { origin, destination });
      
      const directionsUrl = 'https://maps.googleapis.com/maps/api/directions/json';
      const response = await axios.get(directionsUrl, {
        params: {
          origin: origin,
          destination: destination,
          key: this.googleMapsApiKey,
          mode: 'driving',
          alternatives: false,
          traffic_model: 'best_guess',
          departure_time: 'now'
        },
        timeout: 15000
      });
      
      console.log('Directions API response status:', response.data?.status);

      const route = response.data.routes?.[0];
      if (route) {
        const leg = route.legs[0];
        return {
          distance: leg.distance.value / 1000, // Convert to km
          duration: leg.duration.value / 60, // Convert to minutes
          polyline: route.overview_polyline.points,
          instructions: leg.steps.map(step => ({
            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.value / 1000,
            duration: step.duration.value / 60
          }))
        };
      }
    } catch (error) {
      console.error('Google Maps route API error:', error.message);
    }
    return null;
  }

  // Get distance matrix for multiple points using Google Distance Matrix API
  async getDistanceMatrix(origins, destinations, mode = 'driving') {
    try {
      if (!this.googleMapsApiKey) {
        throw new Error('Google Maps API key not configured');
      }

      // Format origins and destinations as strings
      const originsStr = origins.map(coord => `${coord[0]},${coord[1]}`).join('|');
      const destinationsStr = destinations.map(coord => `${coord[0]},${coord[1]}`).join('|');

      const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
        params: {
          origins: originsStr,
          destinations: destinationsStr,
          key: this.googleMapsApiKey,
          mode: mode,
          units: 'metric',
          traffic_model: 'best_guess',
          departure_time: 'now'
        },
        timeout: 10000
      });

      if (response.data?.status === 'OK' && response.data?.rows) {
        const matrix = [];
        response.data.rows.forEach((row, i) => {
          const rowData = [];
          row.elements.forEach((element, j) => {
            if (element.status === 'OK') {
              rowData.push({
                distance: element.distance.value / 1000, // Convert to km
                duration: element.duration.value / 60, // Convert to minutes
                durationInTraffic: element.duration_in_traffic ? element.duration_in_traffic.value / 60 : null
              });
            } else {
              rowData.push(null);
            }
          });
          matrix.push(rowData);
        });
        return matrix;
      }
    } catch (error) {
      console.error('Google Distance Matrix API error:', error.message);
    }
    return null;
  }

  // Optimize route using real-time data
  async optimizeRouteWithRealTime(attractions, accommodation) {
    try {
      console.log('=== Route Optimization Started ===');
      console.log('Attractions count:', attractions.length);
      console.log('Has accommodation:', !!accommodation);
      
      if (!attractions || attractions.length === 0) {
        console.warn('No attractions provided for route optimization');
        return {
          route: [],
          totalDistance: 0,
          totalTime: 0,
          algorithm: 'none',
          error: 'No attractions provided'
        };
      }
      
      const { graph, nodes } = this.buildGraph(attractions, accommodation);
      
      console.log('Graph built with nodes:', nodes.length);
      
      // For round trips (accommodation → attractions → accommodation), use nearest neighbor
      // Dijkstra is for point-to-point, not for visiting all nodes
      const hasAccommodation = nodes.find(n => n.id === 'accommodation');
      const attractionNodes = nodes.filter(n => n.type === 'attraction');
      const hasMultipleAttractions = attractionNodes.length > 1;
      
      // Always use nearest neighbor for round trips (accommodation → all attractions → accommodation)
      if (hasAccommodation && attractionNodes.length > 0) {
        console.log(`Using nearest neighbor optimization for round trip (${attractionNodes.length} attractions)`);
        const simpleRoute = this.nearestNeighborOptimization(attractions, accommodation);
        
        if (simpleRoute && simpleRoute.length > 0) {
          const routeSegments = [];
          let totalDist = 0;
          let totalTime = 0;
          
          for (const seg of simpleRoute) {
            // Extract coordinates properly
            let fromCoords = null;
            let toCoords = null;
            
            // Handle 'from' coordinates
            if (seg.from && seg.from.coordinates) {
              fromCoords = Array.isArray(seg.from.coordinates) ? seg.from.coordinates : [seg.from.latitude || seg.from.lat, seg.from.longitude || seg.from.lng];
            } else if (accommodation) {
              const accCoords = accommodation.coordinates || [accommodation.latitude || accommodation.lat, accommodation.longitude || accommodation.lng];
              fromCoords = Array.isArray(accCoords) ? accCoords : null;
            }
            
            // Handle 'to' coordinates
            if (seg.attraction) {
              const attr = seg.attraction;
              toCoords = attr.coordinates || [attr.latitude || attr.lat, attr.longitude || attr.lng];
              toCoords = Array.isArray(toCoords) ? toCoords : null;
            } else if (seg.to && seg.to.coordinates) {
              toCoords = Array.isArray(seg.to.coordinates) ? seg.to.coordinates : [seg.to.latitude || seg.to.lat, seg.to.longitude || seg.to.lng];
            }
            
            if (fromCoords && toCoords && fromCoords.length === 2 && toCoords.length === 2) {
              const distance = seg.distance || this.calculateDistance(fromCoords, toCoords);
              const duration = seg.travelTime || this.estimateTravelTime(distance);
              
              totalDist += distance;
              totalTime += duration;
              
              routeSegments.push({
                from: {
                  id: seg.from?.id || 'start',
                  name: seg.from?.name || 'Start',
                  coordinates: fromCoords
                },
                to: {
                  id: seg.attraction?.id || seg.to?.id || seg.id,
                  name: seg.attraction?.name || seg.to?.name || seg.name || 'Destination',
                  coordinates: toCoords
                },
                route: {
                  distance: distance,
                  duration: duration,
                  instructions: []
                }
              });
            }
          }
          
          console.log(`✅ Nearest neighbor route complete: ${routeSegments.length} segments`);
          
          return {
            route: routeSegments,
            totalDistance: totalDist,
            totalTime: totalTime,
            algorithm: 'nearest_neighbor'
          };
        }
      }
      
      // Fallback: If no accommodation, connect attractions in order
      if (attractionNodes.length >= 2) {
        console.log('Using simple path connection for attractions');
        const routeSegments = [];
        let totalDist = 0;
        let totalTime = 0;
        
        // Connect attractions in order
        for (let i = 0; i < attractionNodes.length - 1; i++) {
          const current = attractionNodes[i];
          const next = attractionNodes[i + 1];
          
          if (current.coordinates && next.coordinates && 
              Array.isArray(current.coordinates) && Array.isArray(next.coordinates)) {
            const distance = this.calculateDistance(current.coordinates, next.coordinates);
            const duration = this.estimateTravelTime(distance);
            
            totalDist += distance;
            totalTime += duration;
            
            routeSegments.push({
              from: current,
              to: next,
              route: {
                distance: distance,
                duration: duration,
                instructions: []
              }
            });
          }
        }
        
        if (routeSegments.length > 0) {
          console.log(`✅ Simple path route complete: ${routeSegments.length} segments`);
          
          return {
            route: routeSegments,
            totalDistance: totalDist,
            totalTime: totalTime,
            algorithm: 'simple_path'
          };
        }
      }
      
      // Last resort: Return empty route
      console.warn('⚠️ Could not build route - insufficient nodes or coordinates');
      return {
        route: [],
        totalDistance: 0,
        totalTime: 0,
        algorithm: 'none',
        error: 'Insufficient data to build route'
      };

    } catch (error) {
      console.error('Route optimization error:', error);
      return {
        route: [],
        totalDistance: 0,
        totalTime: 0,
        error: error.message
      };
    }
  }

  // Nearest neighbor algorithm for simple optimization
  nearestNeighborOptimization(attractions, accommodation) {
    const route = [];
    const unvisited = [...attractions];
    
    // Handle accommodation coordinates
    let current = null;
    let currentCoords = null;
    
    if (accommodation) {
      if (accommodation.coordinates && Array.isArray(accommodation.coordinates)) {
        currentCoords = accommodation.coordinates;
      } else if (accommodation.latitude && accommodation.longitude) {
        currentCoords = [accommodation.latitude, accommodation.longitude];
      } else if (accommodation.lat && accommodation.lng) {
        currentCoords = [accommodation.lat, accommodation.lng];
      }
      
      if (currentCoords && currentCoords.length === 2) {
        current = {
          coordinates: currentCoords,
          name: accommodation.name || 'Accommodation',
          id: 'accommodation'
        };
      }
    }
    
    // If no accommodation or invalid, start from first attraction
    if (!current && unvisited.length > 0) {
      const first = unvisited.shift();
      current = {
        coordinates: first.coordinates || [first.latitude || first.lat, first.longitude || first.lng],
        name: first.name,
        id: first.id
      };
    }

    while (unvisited.length > 0 && current) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;
      
      // Find nearest unvisited attraction
      for (let i = 0; i < unvisited.length; i++) {
        const attr = unvisited[i];
        let attrCoords = null;
        if (attr.coordinates && Array.isArray(attr.coordinates)) {
          attrCoords = attr.coordinates;
        } else if (attr.latitude && attr.longitude) {
          attrCoords = [attr.latitude, attr.longitude];
        } else if (attr.lat && attr.lng) {
          attrCoords = [attr.lat, attr.lng];
        }
        
        if (attrCoords && attrCoords.length === 2) {
          const distance = this.calculateDistance(current.coordinates, attrCoords);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }

      if (nearestDistance === Infinity) break;
      
      const nearest = unvisited.splice(nearestIndex, 1)[0];
      let nearestCoords = null;
      if (nearest.coordinates && Array.isArray(nearest.coordinates)) {
        nearestCoords = nearest.coordinates;
      } else if (nearest.latitude && nearest.longitude) {
        nearestCoords = [nearest.latitude, nearest.longitude];
      } else if (nearest.lat && nearest.lng) {
        nearestCoords = [nearest.lat, nearest.lng];
      }
      
      if (nearestCoords && nearestCoords.length === 2) {
        route.push({
          from: current,
          to: {
            id: nearest.id,
            name: nearest.name,
            coordinates: nearestCoords
          },
          attraction: nearest,
          distance: nearestDistance,
          travelTime: this.estimateTravelTime(nearestDistance)
        });
        current = {
          coordinates: nearestCoords,
          name: nearest.name,
          id: nearest.id
        };
      }
    }

    return route;
  }

  // Calculate total route metrics
  calculateRouteMetrics(route) {
    if (!route || !Array.isArray(route) || route.length === 0) {
      return {
        totalDistance: 0,
        totalTravelTime: 0,
        totalAttractionTime: 0,
        totalTripTime: 0
      };
    }

    const totalDistance = route.reduce((sum, segment) => {
      if (segment.route && segment.route.distance) {
        return sum + segment.route.distance;
      } else if (segment.distance) {
        return sum + segment.distance;
      }
      return sum;
    }, 0);
    
    const totalTime = route.reduce((sum, segment) => {
      if (segment.route && segment.route.duration) {
        return sum + segment.route.duration;
      } else if (segment.travelTime) {
        return sum + segment.travelTime;
      } else if (segment.duration) {
        return sum + segment.duration;
      }
      return sum;
    }, 0);
    
    const totalAttractionTime = route.reduce((sum, segment) => {
      if (segment.to && segment.to.duration) {
        return sum + this.parseDuration(segment.to.duration);
      } else if (segment.attraction && segment.attraction.duration) {
        return sum + this.parseDuration(segment.attraction.duration);
      }
      return sum;
    }, 0);

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTravelTime: Math.round(totalTime * 100) / 100,
      totalAttractionTime: Math.round(totalAttractionTime * 100) / 100,
      totalTripTime: Math.round((totalTime + totalAttractionTime) * 100) / 100
    };
  }
}

export default new RouteOptimizationService();
