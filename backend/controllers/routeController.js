import routeOptimizationService from '../services/routeOptimizationService.js';
import { sendSuccess, sendError, sendValidationError } from '../utils/responseHelper.js';
import { validateRequestBody, validateRequiredFields, validateRequiredQueryParams } from '../utils/requestValidator.js';

// Optimize route using Dijkstra's algorithm and real-time data
export const optimizeRoute = async (req, res) => {
  try {
    const {
      attractions = [],
      accommodation = null,
      preferences = {},
      optimizationType = 'time' // 'time', 'distance', 'balanced'
    } = req.body;

    // Validate request body
    if (!validateRequestBody(req, res)) return;

    // Validate required fields
    if (!validateRequiredFields(req, res, ['attractions'])) return;

    if (!Array.isArray(attractions) || attractions.length === 0) {
      return sendValidationError(res, ['At least one attraction is required for route optimization']);
    }

    console.log('Route optimization request:', { 
      attractionsCount: attractions.length, 
      hasAccommodation: !!accommodation,
      optimizationType 
    });

    // Use AI-powered route optimization
    const optimizedRoute = await routeOptimizationService.optimizeRouteWithRealTime(
      attractions, 
      accommodation
    );

    // Calculate route metrics (only if route exists and has segments)
    let metrics = { totalDistance: 0, totalTravelTime: 0, totalAttractionTime: 0, totalTripTime: 0 };
    if (optimizedRoute.route && Array.isArray(optimizedRoute.route) && optimizedRoute.route.length > 0) {
      try {
        metrics = routeOptimizationService.calculateRouteMetrics(optimizedRoute.route);
      } catch (error) {
        console.warn('Error calculating route metrics, using defaults:', error.message);
        // Use values from optimizedRoute if available
        metrics = {
          totalDistance: optimizedRoute.totalDistance || 0,
          totalTravelTime: optimizedRoute.totalTime || 0,
          totalAttractionTime: 0,
          totalTripTime: optimizedRoute.totalTime || 0
        };
      }
    } else {
      // If no route segments, use values from optimizedRoute
      metrics = {
        totalDistance: optimizedRoute.totalDistance || 0,
        totalTravelTime: optimizedRoute.totalTime || 0,
        totalAttractionTime: 0,
        totalTripTime: optimizedRoute.totalTime || 0
      };
    }

    // Add optimization insights
    const insights = generateRouteInsights(optimizedRoute, metrics, preferences);

    return sendSuccess(res, {
      route: optimizedRoute.route,
      metrics: metrics,
      insights: insights
    }, {
      algorithm: optimizedRoute.algorithm,
      optimizationType: optimizationType
    });

  } catch (error) {
    console.error('Route optimization error:', error);
    sendError(res, 'Failed to optimize route', 'ROUTE_OPTIMIZATION_ERROR', error.message, 500);
  }
};

// Get detailed route information between two points
export const getRouteDetails = async (req, res) => {
  try {
    const { start, end, mode = 'driving' } = req.query;

    // Validate required query parameters
    if (!validateRequiredQueryParams(req, res, ['start', 'end'])) return;

    const startCoords = start.split(',').map(Number);
    const endCoords = end.split(',').map(Number);

    if (startCoords.length !== 2 || endCoords.length !== 2 || isNaN(startCoords[0]) || isNaN(startCoords[1]) || isNaN(endCoords[0]) || isNaN(endCoords[1])) {
      return sendValidationError(res, ['Invalid coordinate format. Use lat,lng (e.g., 28.6139,77.2090)']);
    }

    // Get route from Google Maps
    let routeData = await routeOptimizationService.getGoogleMapsRoute(startCoords, endCoords);
    if (!routeData) {
      routeData = await routeOptimizationService.getGoogleMapsRoute(startCoords, endCoords);
    }

    if (!routeData) {
      // Fallback to distance calculation
      const distance = routeOptimizationService.calculateDistance(startCoords, endCoords);
      routeData = {
        distance: distance,
        duration: routeOptimizationService.estimateTravelTime(distance),
        instructions: [],
        polyline: null
      };
    }

    return sendSuccess(res, {
      route: routeData,
      start: { coordinates: startCoords },
      end: { coordinates: endCoords }
    }, {
      mode: mode
    });

  } catch (error) {
    console.error('Route details error:', error);
    sendError(res, 'Failed to get route details', 'ROUTE_DETAILS_ERROR', error.message, 500);
  }
};

// Calculate distance between multiple points using Distance Matrix API
export const calculateDistance = async (req, res) => {
  try {
    const { points = [], useDistanceMatrix = true } = req.body;

    // Validate request body
    if (!validateRequestBody(req, res)) return;

    // Validate required fields
    if (!validateRequiredFields(req, res, ['points'])) return;

    if (!Array.isArray(points) || points.length < 2) {
      return sendValidationError(res, ['At least two points are required for distance calculation']);
    }

    // Use Google Distance Matrix API if enabled and we have multiple points
    if (useDistanceMatrix && points.length > 2) {
      try {
        const coordinates = points.map(p => p.coordinates || [p.lat, p.lng]);
        const distanceMatrix = await routeOptimizationService.getDistanceMatrix(
          coordinates,
          coordinates,
          'driving'
        );

        if (distanceMatrix) {
          const distances = [];
          let totalDistance = 0;
          let totalTravelTime = 0;

          for (let i = 0; i < points.length - 1; i++) {
            const matrixData = distanceMatrix[i]?.[i + 1];
            if (matrixData) {
              const distance = Math.round(matrixData.distance * 100) / 100;
              const duration = Math.round(matrixData.duration * 100) / 100;
              distances.push({
                from: points[i],
                to: points[i + 1],
                distance: distance,
                estimatedTravelTime: duration,
                durationInTraffic: matrixData.durationInTraffic ? Math.round(matrixData.durationInTraffic * 100) / 100 : null
              });
              totalDistance += distance;
              totalTravelTime += duration;
            } else {
              // Fallback to Haversine if matrix data not available
              const distance = routeOptimizationService.calculateDistance(
                points[i].coordinates || [points[i].lat, points[i].lng],
                points[i + 1].coordinates || [points[i + 1].lat, points[i + 1].lng]
              );
              distances.push({
                from: points[i],
                to: points[i + 1],
                distance: Math.round(distance * 100) / 100,
                estimatedTravelTime: Math.round(routeOptimizationService.estimateTravelTime(distance))
              });
              totalDistance += distance;
              totalTravelTime += routeOptimizationService.estimateTravelTime(distance);
            }
          }

          return sendSuccess(res, {
            distances: distances,
            totalDistance: Math.round(totalDistance * 100) / 100,
            totalTravelTime: Math.round(totalTravelTime * 100) / 100,
            source: 'google_distance_matrix'
          }, {
            pointCount: points.length,
            method: 'distance_matrix_api'
          });
        }
      } catch (matrixError) {
        console.warn('Distance Matrix API failed, falling back to Haversine:', matrixError.message);
        // Fall through to Haversine calculation
      }
    }

    // Fallback to Haversine formula calculation
    const distances = [];
    let totalDistance = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const distance = routeOptimizationService.calculateDistance(
        points[i].coordinates || [points[i].lat, points[i].lng],
        points[i + 1].coordinates || [points[i + 1].lat, points[i + 1].lng]
      );
      distances.push({
        from: points[i],
        to: points[i + 1],
        distance: Math.round(distance * 100) / 100,
        estimatedTravelTime: Math.round(routeOptimizationService.estimateTravelTime(distance))
      });
      totalDistance += distance;
    }

    return sendSuccess(res, {
      distances: distances,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalTravelTime: Math.round(routeOptimizationService.estimateTravelTime(totalDistance)),
      source: 'haversine'
    }, {
      pointCount: points.length,
      method: 'haversine_formula'
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    sendError(res, 'Failed to calculate distances', 'DISTANCE_CALCULATION_ERROR', error.message, 500);
  }
};

// Generate route optimization insights
function generateRouteInsights(optimizedRoute, metrics) {
  const insights = {
    efficiency: {},
    recommendations: [],
    warnings: [],
    alternatives: []
  };

  // Efficiency analysis
  const avgDistancePerAttraction = metrics.totalDistance / optimizedRoute.route.length;
  insights.efficiency = {
    averageDistancePerStop: Math.round(avgDistancePerAttraction * 100) / 100,
    totalStops: optimizedRoute.route.length,
    efficiencyScore: calculateEfficiencyScore(metrics),
    rating: getEfficiencyRating(metrics)
  };

  // Generate recommendations
  if (metrics.totalTravelTime > 180) { // More than 3 hours of travel
    insights.recommendations.push({
      type: 'travel_time',
      message: 'Consider reducing the number of attractions or staying overnight',
      priority: 'medium'
    });
  }

  if (metrics.totalDistance > 100) { // More than 100km
    insights.recommendations.push({
      type: 'distance',
      message: 'Long distance route - ensure adequate fuel and breaks',
      priority: 'low'
    });
  }

  // Check for potential issues
  optimizedRoute.route.forEach((segment, index) => {
    if (segment.route && segment.route.duration > 60) { // More than 1 hour travel
      insights.warnings.push({
        type: 'long_travel',
        message: `Long travel time between ${segment.from.name} and ${segment.to.name} (${Math.round(segment.route.duration)} minutes)`,
        segment: index
      });
    }
  });

  // Suggest alternatives
  if (insights.efficiency.efficiencyScore < 0.6) {
    insights.alternatives.push({
      type: 'route_optimization',
      message: 'Consider using nearest neighbor algorithm for better efficiency',
      algorithm: 'nearest_neighbor'
    });
  }

  return insights;
}

// Calculate efficiency score (0-1, higher is better)
function calculateEfficiencyScore(metrics) {
  // Factors: travel time, distance, number of stops
  const maxTravelTime = 300; // 5 hours
  const maxDistance = 200; // 200km
  
  const timeScore = Math.max(0, 1 - (metrics.totalTravelTime / maxTravelTime));
  const distanceScore = Math.max(0, 1 - (metrics.totalDistance / maxDistance));
  
  return (timeScore + distanceScore) / 2;
}

// Get efficiency rating
function getEfficiencyRating(metrics) {
  const score = calculateEfficiencyScore(metrics);
  
  if (score >= 0.8) return 'excellent';
  if (score >= 0.6) return 'good';
  if (score >= 0.4) return 'fair';
  return 'poor';
}
