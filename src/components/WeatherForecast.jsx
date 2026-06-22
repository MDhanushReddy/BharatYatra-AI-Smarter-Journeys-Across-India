import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { getDailyForecast, getHourlyForecast } from '../utils/weatherAPI';

const WeatherForecast = ({ destination, dates, dailyItinerary, onUpdateRecommendations }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [hourlyData, setHourlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  // Weather condition icons mapping
  const weatherIcons = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'thunderstorm': '⛈️',
    'snow': '🌨️',
    'mist': '🌫️'
  };

  // Activity recommendations based on weather and UV index
  const getActivityRecommendations = (weather, uvi) => {
    const recommendations = {
      'clear': {
        recommended: uvi > 8 
          ? ['Indoor sightseeing during peak hours', 'Early morning outdoor activities', 'Evening outdoor dining']
          : ['Outdoor sightseeing', 'Photography tours', 'Garden visits', 'Outdoor dining'],
        alternative: ['Indoor museums', 'Art galleries', 'Local markets']
      },
      'clouds': {
        recommended: ['City walks', 'Shopping', 'Cafe hopping', 'Park visits'],
        alternative: ['Indoor attractions', 'Cultural shows', 'Cooking classes']
      },
      'rain': {
        recommended: ['Museum visits', 'Indoor shopping', 'Spa treatments', 'Cultural shows'],
        alternative: ['Temple visits', 'Art galleries', 'Local workshops']
      },
      'thunderstorm': {
        recommended: ['Indoor activities', 'Museum tours', 'Shopping malls', 'Local cuisine'],
        alternative: ['Spa visits', 'Cooking classes', 'Cultural experiences']
      },
      'snow': {
        recommended: ['Winter sports', 'Hot springs', 'Cozy cafes', 'Photography'],
        alternative: ['Indoor sightseeing', 'Museums', 'Shopping']
      },
      'mist': {
        recommended: ['Scenic drives', 'Photography', 'Tea houses', 'Temple visits'],
        alternative: ['Indoor attractions', 'Local markets', 'Cultural activities']
      }
    };

    return recommendations[weather] || recommendations['clear'];
  };

  // Fetch weather data
  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get daily forecast
        const dailyForecast = await getDailyForecast(
          destination,
          dates.startDate,
          dates.endDate
        );
        setWeatherData(dailyForecast);
        
        // Get hourly forecast for the first day
        const hourlyForecast = await getHourlyForecast(
          destination,
          dates.startDate
        );
        setHourlyData(hourlyForecast);
        
        // Update activity recommendations based on weather and UV index
        if (onUpdateRecommendations) {
          const recommendations = dailyForecast.map(day => 
            getActivityRecommendations(day.weather, day.uvi)
          );
          onUpdateRecommendations(recommendations);
        }
      } catch (err) {
        setError('Failed to fetch weather data. Please try again later.');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (destination && dates.startDate && dates.endDate) {
      fetchWeatherData();
    }
  }, [destination, dates]);

  // Fetch hourly data when selected day changes
  useEffect(() => {
    const fetchHourlyData = async () => {
      try {
        const selectedDate = new Date(dates.startDate);
        selectedDate.setDate(selectedDate.getDate() + selectedDay);
        
        const hourlyForecast = await getHourlyForecast(
          destination,
          selectedDate
        );
        setHourlyData(hourlyForecast);
      } catch (err) {
        console.error('Error fetching hourly data:', err);
      }
    };

    if (destination && dates.startDate && selectedDay !== null) {
      fetchHourlyData();
    }
  }, [selectedDay, destination, dates.startDate]);

  if (loading) {
    return <LoadingSpinner message="Loading weather forecast..." />;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        Weather Forecast
      </h3>
      
      <div className="space-y-6">
        {/* Daily forecast */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {weatherData && weatherData.map((day, index) => (
            <div
              key={index}
              className={`bg-gray-50 rounded-lg p-4 cursor-pointer transition-all ${
                selectedDay === index ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100'
              }`}
              onClick={() => setSelectedDay(index)}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-gray-900">
                    Day {index + 1}
                  </p>
                  <p className="text-sm text-gray-600">
                    {day.date.toLocaleDateString()}
                  </p>
                </div>
                <span className="text-2xl">
                  {weatherIcons[day.weather]}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Temperature</span>
                  <span className="font-medium">
                    {day.temperature.min}°C - {day.temperature.max}°C
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rain Chance</span>
                  <span className="font-medium">{day.precipitation}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">UV Index</span>
                  <span className={`font-medium ${
                    day.uvi > 8 ? 'text-red-600' :
                    day.uvi > 5 ? 'text-orange-600' :
                    'text-green-600'
                  }`}>{day.uvi}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>☀️ {day.sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>🌙 {day.sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hourly forecast for selected day */}
        {hourlyData && (
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Hourly Forecast - Day {selectedDay + 1}
            </h4>
            <div className="overflow-x-auto">
              <div className="flex space-x-4 pb-4">
                {hourlyData.map((hour, index) => (
                  <div key={index} className="flex-none w-32 bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                      {hour.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex items-center justify-between my-2">
                      <span className="text-xl">
                        {weatherIcons[hour.weather]}
                      </span>
                      <span className="font-medium">{hour.temperature}°C</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <p>Rain: {hour.precipitation}%</p>
                      <p>Wind: {hour.windSpeed} km/h</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {weatherData && weatherData[selectedDay] && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Recommendations for Day {selectedDay + 1}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-600 mb-2">
                  Recommended Activities:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {getActivityRecommendations(
                    weatherData[selectedDay].weather,
                    weatherData[selectedDay].uvi
                  ).recommended.map((activity, i) => (
                    <li key={i} className="flex items-center">
                      <span className="mr-2">•</span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 mb-2">
                  Alternative Activities:
                </p>
                <ul className="space-y-1 text-sm text-gray-600">
                  {getActivityRecommendations(
                    weatherData[selectedDay].weather,
                    weatherData[selectedDay].uvi
                  ).alternative.map((activity, i) => (
                    <li key={i} className="flex items-center">
                      <span className="mr-2">•</span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherForecast; 