import express from "express";
import axios from "axios";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();

// -------- Unified Travel Search Route --------
router.get("/search", async (req, res) => {
  const { 
    destination = "Goa", 
    checkin_date = "2025-11-01", 
    checkout_date = "2025-11-05", 
    adults_number = 2,
    room_number = "1",
    include_hotels = "true",
    include_attractions = "true",
    attractions_limit = 10,
    hotels_limit = 10
  } = req.query;

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  
  if (!rapidApiKey) {
    return res.status(500).json({ 
      message: "RapidAPI key not configured",
      hotels: [],
      attractions: [],
      source: "error"
    });
  }

  const results = {
    destination,
    hotels: [],
    attractions: [],
    metadata: {
      search_date: new Date().toISOString(),
      include_hotels: include_hotels === "true",
      include_attractions: include_attractions === "true"
    }
  };

  // -------- Parallel API Calls --------
  const promises = [];

  // Hotels API Call (if requested)
  if (include_hotels === "true") {
    const hotelsPromise = getHotels(destination, checkin_date, checkout_date, adults_number, room_number, rapidApiKey);
    promises.push(hotelsPromise);
  }

  // Attractions API Call (if requested)
  if (include_attractions === "true") {
    const attractionsPromise = getAttractions(destination, attractions_limit, rapidApiKey);
    promises.push(attractionsPromise);
  }

  try {
    // Execute both API calls in parallel
    const responses = await Promise.allSettled(promises);
    
    let responseIndex = 0;
    
    // Process hotels response
    if (include_hotels === "true") {
      const hotelsResponse = responses[responseIndex++];
      if (hotelsResponse.status === 'fulfilled') {
        results.hotels = hotelsResponse.value;
        results.metadata.hotels_source = 'rapidapi_booking';
      } else {
        console.error("Hotels API Error:", hotelsResponse.reason);
        results.hotels = getFallbackHotels(destination);
        results.metadata.hotels_source = 'fallback';
        results.metadata.hotels_error = hotelsResponse.reason.message;
      }
    }

    // Process attractions response
    if (include_attractions === "true") {
      const attractionsResponse = responses[responseIndex++];
      if (attractionsResponse.status === 'fulfilled') {
        results.attractions = attractionsResponse.value;
        results.metadata.attractions_source = 'rapidapi_travel_advisor';
      } else {
        console.error("Attractions API Error:", attractionsResponse.reason);
        results.attractions = getFallbackAttractions(destination);
        results.metadata.attractions_source = 'fallback';
        results.metadata.attractions_error = attractionsResponse.reason.message;
      }
    }

    res.json(results);

  } catch (error) {
    console.error("Unified Travel Search Error:", error);
    res.status(500).json({ 
      message: "Failed to fetch travel data", 
      error: error.message,
      destination,
      hotels: include_hotels === "true" ? getFallbackHotels(destination) : [],
      attractions: include_attractions === "true" ? getFallbackAttractions(destination) : [],
      source: "error"
    });
  }
});

// -------- Hotels API Function --------
async function getHotels(destination, checkin_date, checkout_date, adults_number, room_number, rapidApiKey) {
  // First, get destination ID
  const destId = await getDestinationId(destination, rapidApiKey);
  
  const options = {
    method: "GET",
    url: "https://booking-com.p.rapidapi.com/v1/hotels/search",
    params: {
      order_by: "popularity",
      adults_number,
      checkin_date,
      checkout_date,
      filter_by_currency: "INR",
      locale: "en-gb",
      units: "metric",
      room_number,
      dest_type: "city",
      dest_id: destId,
    },
    headers: {
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": "booking-com.p.rapidapi.com",
    },
  };

  const response = await axios.request(options);
  return response.data.result || [];
}

// -------- Attractions API Function --------
async function getAttractions(destination, limit, rapidApiKey) {
  // Get location ID for the destination
  const locationId = await getLocationId(destination, rapidApiKey);
  
  const options = {
    method: "GET",
    url: "https://travel-advisor.p.rapidapi.com/attractions/list",
    params: {
      location_id: locationId,
      currency: "INR",
      lang: "en_US",
      lunit: "km",
      sort: "recommended",
      limit: limit
    },
    headers: {
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": "travel-advisor.p.rapidapi.com",
    },
  };

  const response = await axios.request(options);
  return response.data.data || [];
}

// -------- Helper Functions --------
async function getDestinationId(destination, rapidApiKey) {
  try {
    const options = {
      method: "GET",
      url: "https://booking-com.p.rapidapi.com/v1/hotels/locations",
      params: {
        name: destination,
        locale: "en-gb"
      },
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "booking-com.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    return response.data[0]?.dest_id || "-2106102"; // Default to Goa
  } catch (error) {
    console.error("Error getting destination ID:", error.message);
    return "-2106102"; // Default to Goa
  }
}

async function getLocationId(destination, rapidApiKey) {
  try {
    const options = {
      method: "GET",
      url: "https://travel-advisor.p.rapidapi.com/locations/search",
      params: {
        query: destination,
        limit: 1
      },
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": "travel-advisor.p.rapidapi.com",
      },
    };

    const response = await axios.request(options);
    return response.data.data?.[0]?.location_id || "297604"; // Default to Goa
  } catch (error) {
    console.error("Error getting location ID:", error.message);
    return "297604"; // Default to Goa
  }
}

// -------- Fallback Data Functions --------
function getFallbackHotels(destination) {
  return [
    {
      hotel_id: 1,
      hotel_name: `${destination} Hotel`,
      min_total_price: 2500,
      review_score: 4.2,
      hotel_name_trans: `${destination} Hotel`,
      max_photo_url: "",
      city_trans: destination
    },
    {
      hotel_id: 2,
      hotel_name: `${destination} Resort`,
      min_total_price: 4500,
      review_score: 4.5,
      hotel_name_trans: `${destination} Resort`,
      max_photo_url: "",
      city_trans: destination
    }
  ];
}

function getFallbackAttractions(destination) {
  return [
    {
      location_id: 1,
      name: `${destination} Tourist Spot`,
      rating: 4.2,
      description: `A popular tourist destination in ${destination}`,
      latitude: "28.6139",
      longitude: "77.2090",
      photo: { images: { large: { url: "" } } }
    },
    {
      location_id: 2,
      name: `${destination} Heritage Site`,
      rating: 4.5,
      description: `Historical and cultural significance in ${destination}`,
      latitude: "28.6139",
      longitude: "77.2090",
      photo: { images: { large: { url: "" } } }
    }
  ];
}

export default router;
