// Weather Service for real-time weather updates and travel alerts
import axios from 'axios';

class WeatherService {
  constructor() {
    this.openweatherApiKey = process.env.OPENWEATHER_API_KEY;
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
  }

  // Get weather forecast from OpenWeatherMap API
  async getWeatherForecast(location, days = 5) {
    try {
      const cacheKey = `weather_${location}_${days}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      if (this.openweatherApiKey) {
        // Get coordinates for location
        const coords = await this.getCoordinates(location);
        if (!coords) {
          throw new Error('Location not found');
        }

        const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
          params: {
            lat: coords.lat,
            lon: coords.lon,
            appid: this.openweatherApiKey,
            units: 'metric',
            cnt: days * 8 // 8 forecasts per day (every 3 hours)
          },
          timeout: 10000
        });

        const forecast = this.processWeatherData(response.data, days);
        
        // Cache the result
        this.cache.set(cacheKey, {
          data: forecast,
          timestamp: Date.now()
        });

        return forecast;
      } else {
        // Fallback to Open-Meteo (no API key required)
        return await this.getOpenMeteoForecast(location, days);
      }
    } catch (error) {
      console.error('Weather API error:', error.message);
      return this.getFallbackWeather(location, days);
    }
  }

  // Get coordinates for a location using geocoding
  async getCoordinates(location) {
    try {
      if (this.openweatherApiKey) {
        const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
          params: {
            q: `${location}, India`,
            limit: 1,
            appid: this.openweatherApiKey
          },
          timeout: 5000
        });

        if (response.data && response.data.length > 0) {
          return {
            lat: response.data[0].lat,
            lon: response.data[0].lon
          };
        }
      }

      // Fallback coordinates for major Indian cities
      const cityCoordinates = {
        'mumbai': { lat: 19.0760, lon: 72.8777 },
        'delhi': { lat: 28.7041, lon: 77.1025 },
        'bangalore': { lat: 12.9716, lon: 77.5946 },
        'goa': { lat: 15.2993, lon: 74.1240 },
        'kolkata': { lat: 22.5726, lon: 88.3639 },
        'chennai': { lat: 13.0827, lon: 80.2707 },
        'hyderabad': { lat: 17.3850, lon: 78.4867 },
        'pune': { lat: 18.5204, lon: 73.8567 }
      };

      return cityCoordinates[location.toLowerCase()] || { lat: 28.6139, lon: 77.2090 };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return null;
    }
  }

  // Process weather data from OpenWeatherMap
  processWeatherData(weatherData, days) {
    const dailyForecasts = [];
    const forecasts = weatherData.list;

    // Group forecasts by date
    const groupedByDate = {};
    forecasts.forEach(forecast => {
      const date = new Date(forecast.dt * 1000).toISOString().split('T')[0];
      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }
      groupedByDate[date].push(forecast);
    });

    // Process each day
    Object.keys(groupedByDate).slice(0, days).forEach(date => {
      const dayForecasts = groupedByDate[date];
      const temperatures = dayForecasts.map(f => f.main.temp);
      const conditions = dayForecasts.map(f => f.weather[0]);
      const precipitation = dayForecasts.map(f => f.rain?.['3h'] || 0);

      dailyForecasts.push({
        date: date,
        temperature: {
          min: Math.round(Math.min(...temperatures)),
          max: Math.round(Math.max(...temperatures)),
          avg: Math.round(temperatures.reduce((a, b) => a + b, 0) / temperatures.length)
        },
        weather: this.getMostCommonCondition(conditions),
        precipitation: Math.round(precipitation.reduce((a, b) => a + b, 0) * 100) / 100,
        humidity: Math.round(dayForecasts[0].main.humidity),
        windSpeed: Math.round(dayForecasts[0].wind.speed * 3.6), // Convert to km/h
        sunrise: new Date(dayForecasts[0].sys.sunrise * 1000).toTimeString().split(' ')[0],
        sunset: new Date(dayForecasts[0].sys.sunset * 1000).toTimeString().split(' ')[0],
        alerts: this.generateWeatherAlerts(conditions, temperatures, precipitation)
      });
    });

    return dailyForecasts;
  }

  // Fallback to Open-Meteo API (no key required)
  async getOpenMeteoForecast(location, days) {
    try {
      const coords = await this.getCoordinates(location);
      if (!coords) {
        throw new Error('Location not found');
      }

      const response = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: coords.lat,
          longitude: coords.lon,
          daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code',
          timezone: 'Asia/Kolkata',
          forecast_days: days
        },
        timeout: 10000
      });

      const data = response.data;
      const dailyForecasts = [];

      for (let i = 0; i < days; i++) {
        dailyForecasts.push({
          date: data.daily.time[i],
          temperature: {
            min: Math.round(data.daily.temperature_2m_min[i]),
            max: Math.round(data.daily.temperature_2m_max[i]),
            avg: Math.round((data.daily.temperature_2m_min[i] + data.daily.temperature_2m_max[i]) / 2)
          },
          weather: this.weatherCodeToString(data.daily.weather_code[i]),
          precipitation: data.daily.precipitation_sum[i] || 0,
          humidity: 70, // Default value
          windSpeed: 10, // Default value
          sunrise: '06:00', // Default value
          sunset: '18:00', // Default value
          alerts: this.generateWeatherAlerts(
            [{ main: this.weatherCodeToString(data.daily.weather_code[i]) }],
            [data.daily.temperature_2m_max[i]],
            [data.daily.precipitation_sum[i] || 0]
          )
        });
      }

      return dailyForecasts;
    } catch (error) {
      console.error('Open-Meteo API error:', error.message);
      throw error;
    }
  }

  // Convert weather code to description
  weatherCodeToString(code) {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      85: 'Slight snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
  }

  // Get most common weather condition for the day
  getMostCommonCondition(conditions) {
    const conditionCounts = {};
    conditions.forEach(condition => {
      const main = condition.main.toLowerCase();
      conditionCounts[main] = (conditionCounts[main] || 0) + 1;
    });

    return Object.keys(conditionCounts).reduce((a, b) => 
      conditionCounts[a] > conditionCounts[b] ? a : b
    );
  }

  // Generate weather alerts based on conditions
  generateWeatherAlerts(conditions, temperatures, precipitation) {
    const alerts = [];
    const maxTemp = Math.max(...temperatures);
    const minTemp = Math.min(...temperatures);
    const totalPrecipitation = precipitation.reduce((a, b) => a + b, 0);

    // Temperature alerts
    if (maxTemp > 35) {
      alerts.push({
        type: 'warning',
        message: 'High temperature expected. Stay hydrated and avoid prolonged sun exposure.',
        severity: 'moderate'
      });
    }
    if (minTemp < 10) {
      alerts.push({
        type: 'warning',
        message: 'Low temperature expected. Dress warmly.',
        severity: 'moderate'
      });
    }

    // Precipitation alerts
    if (totalPrecipitation > 10) {
      alerts.push({
        type: 'warning',
        message: 'Heavy rain expected. Plan indoor activities or carry rain gear.',
        severity: 'high'
      });
    } else if (totalPrecipitation > 5) {
      alerts.push({
        type: 'info',
        message: 'Light rain expected. Consider carrying an umbrella.',
        severity: 'low'
      });
    }

    // Weather condition alerts
    const mainConditions = conditions.map(c => c.main.toLowerCase());
    if (mainConditions.includes('thunderstorm')) {
      alerts.push({
        type: 'danger',
        message: 'Thunderstorm expected. Avoid outdoor activities and seek shelter.',
        severity: 'high'
      });
    }
    if (mainConditions.includes('fog')) {
      alerts.push({
        type: 'warning',
        message: 'Foggy conditions expected. Drive carefully and allow extra travel time.',
        severity: 'moderate'
      });
    }

    return alerts;
  }

  // Fallback weather data
  getFallbackWeather(location, days) {
    const forecasts = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      forecasts.push({
        date: date,
        temperature: {
          min: Math.floor(Math.random() * 15) + 15,
          max: Math.floor(Math.random() * 20) + 25,
          avg: Math.floor(Math.random() * 10) + 20
        },
        weather: ['sunny', 'partly cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
        precipitation: Math.floor(Math.random() * 5),
        humidity: Math.floor(Math.random() * 30) + 50,
        windSpeed: Math.floor(Math.random() * 15) + 5,
        sunrise: '06:00',
        sunset: '18:00',
        alerts: []
      });
    }
    return forecasts;
  }

  // Get current weather conditions
  async getCurrentWeather(location) {
    try {
      const coords = await this.getCoordinates(location);
      if (!coords) {
        throw new Error('Location not found');
      }

      if (this.openweatherApiKey) {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat: coords.lat,
            lon: coords.lon,
            appid: this.openweatherApiKey,
            units: 'metric'
          },
          timeout: 5000
        });

        return {
          temperature: Math.round(response.data.main.temp),
          weather: response.data.weather[0].main.toLowerCase(),
          humidity: response.data.main.humidity,
          windSpeed: Math.round(response.data.wind.speed * 3.6),
          description: response.data.weather[0].description,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('No weather API key configured');
      }
    } catch (error) {
      console.error('Current weather error:', error.message);
      return {
        temperature: 25,
        weather: 'sunny',
        humidity: 60,
        windSpeed: 10,
        description: 'Clear sky',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate travel alerts based on weather and location
  async generateTravelAlerts(location, tripDates) {
    try {
      const weatherForecast = await this.getWeatherForecast(location, tripDates.length);
      const alerts = [];

      weatherForecast.forEach((day, index) => {
        const tripDate = tripDates[index];
        
        // High severity alerts
        if (day.alerts.some(alert => alert.severity === 'high')) {
          alerts.push({
            type: 'travel_alert',
            severity: 'high',
            date: day.date,
            message: `Weather Alert for ${tripDate}: ${day.alerts.find(a => a.severity === 'high').message}`,
            recommendations: [
              'Consider rescheduling outdoor activities',
              'Check for flight delays or cancellations',
              'Pack appropriate weather gear'
            ]
          });
        }

        // Temperature-based recommendations
        if (day.temperature.max > 35) {
          alerts.push({
            type: 'temperature_alert',
            severity: 'moderate',
            date: day.date,
            message: `Hot weather expected on ${tripDate} (${day.temperature.max}°C)`,
            recommendations: [
              'Plan indoor activities during peak heat hours (12-4 PM)',
              'Carry plenty of water',
              'Wear light, breathable clothing',
              'Use sunscreen'
            ]
          });
        }

        // Rain-based recommendations
        if (day.precipitation > 5) {
          alerts.push({
            type: 'precipitation_alert',
            severity: 'moderate',
            date: day.date,
            message: `Rain expected on ${tripDate} (${day.precipitation}mm)`,
            recommendations: [
              'Carry umbrella or raincoat',
              'Plan indoor activities',
              'Allow extra travel time',
              'Check if attractions are open in rain'
            ]
          });
        }
      });

      return alerts;
    } catch (error) {
      console.error('Travel alerts error:', error.message);
      return [];
    }
  }
}

export default new WeatherService();
