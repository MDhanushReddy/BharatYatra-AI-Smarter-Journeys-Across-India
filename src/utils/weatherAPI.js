const BASE_URL = 'https://geocoding-api.open-meteo.com/v1';
const WEATHER_URL = 'https://api.open-meteo.com/v1';

// Map weather codes to our weather types
const mapWeatherCode = (code) => {
  // WMO Weather interpretation codes (https://open-meteo.com/en/docs)
  const codeMap = {
    0: 'clear', // Clear sky
    1: 'clear', // Mainly clear
    2: 'clouds', // Partly cloudy
    3: 'clouds', // Overcast
    45: 'mist', // Foggy
    48: 'mist', // Depositing rime fog
    51: 'rain', // Light drizzle
    53: 'rain', // Moderate drizzle
    55: 'rain', // Dense drizzle
    61: 'rain', // Slight rain
    63: 'rain', // Moderate rain
    65: 'rain', // Heavy rain
    71: 'snow', // Slight snow
    73: 'snow', // Moderate snow
    75: 'snow', // Heavy snow
    77: 'snow', // Snow grains
    80: 'rain', // Slight rain showers
    81: 'rain', // Moderate rain showers
    82: 'rain', // Violent rain showers
    85: 'snow', // Slight snow showers
    86: 'snow', // Heavy snow showers
    95: 'thunderstorm', // Thunderstorm
    96: 'thunderstorm', // Thunderstorm with slight hail
    99: 'thunderstorm', // Thunderstorm with heavy hail
  };
  return codeMap[code] || 'clear';
};

// Get coordinates for a location
export const getLocationCoordinates = async (location) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('Location not found');
    }

    return {
      lat: data.results[0].latitude,
      lon: data.results[0].longitude,
      timezone: data.results[0].timezone
    };
  } catch (error) {
    console.error('Error getting location coordinates:', error);
    throw error;
  }
};

// Get daily weather forecast
export const getDailyForecast = async (location, startDate, endDate) => {
  try {
    // Get coordinates for the location
    const { lat, lon, timezone } = await getLocationCoordinates(location);

    // Get forecast
    const response = await fetch(
      `${WEATHER_URL}/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max` +
      `&timezone=${timezone}`
    );
    const data = await response.json();

    if (!data.daily) {
      throw new Error('Failed to get weather forecast');
    }

    // Format the forecast data
    const startTimestamp = new Date(startDate).getTime();
    const endTimestamp = new Date(endDate).getTime();

    return data.daily.time
      .map((time, index) => {
        const date = new Date(time);
        return {
          date,
          weather: mapWeatherCode(data.daily.weathercode[index]),
          temperature: {
            min: Math.round(data.daily.temperature_2m_min[index]),
            max: Math.round(data.daily.temperature_2m_max[index])
          },
          precipitation: data.daily.precipitation_probability_max[index],
          uvi: Math.round(data.daily.uv_index_max[index]),
          sunrise: new Date(data.daily.sunrise[index]),
          sunset: new Date(data.daily.sunset[index])
        };
      })
      .filter(day => {
        const dayTimestamp = day.date.getTime();
        return dayTimestamp >= startTimestamp && dayTimestamp <= endTimestamp;
      });
  } catch (error) {
    console.error('Error getting weather forecast:', error);
    throw error;
  }
};

// Get hourly forecast for a specific day
export const getHourlyForecast = async (location, date) => {
  try {
    const { lat, lon, timezone } = await getLocationCoordinates(location);

    const response = await fetch(
      `${WEATHER_URL}/forecast?latitude=${lat}&longitude=${lon}` +
      `&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m` +
      `&timezone=${timezone}`
    );
    const data = await response.json();

    if (!data.hourly) {
      throw new Error('Failed to get hourly forecast');
    }

    const targetDate = new Date(date);
    const targetDay = targetDate.getDate();

    return data.hourly.time
      .map((time, index) => {
        const datetime = new Date(time);
        return {
          time: datetime,
          weather: mapWeatherCode(data.hourly.weathercode[index]),
          temperature: Math.round(data.hourly.temperature_2m[index]),
          precipitation: data.hourly.precipitation_probability[index],
          windSpeed: Math.round(data.hourly.windspeed_10m[index])
        };
      })
      .filter(hour => hour.time.getDate() === targetDay);
  } catch (error) {
    console.error('Error getting hourly forecast:', error);
    throw error;
  }
}; 