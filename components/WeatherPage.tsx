
import React, { useState, useEffect, useCallback } from 'react';
import { getForecast } from '../services/weatherService';
import { CurrentWeather, DailyWeather } from '../types';
import { formatDate } from '../utils/formatters';
import Card from './ui/Card';
import Button from './ui/Button';

const WeatherPage: React.FC = () => {
  const [weather, setWeather] = useState<{ current: CurrentWeather; daily: DailyWeather[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback((lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    getForecast(lat, lon)
      .then(setWeather)
      .catch(() => setError('Failed to fetch weather data. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const getLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setError('Unable to retrieve your location. Please enable location services.');
        setLoading(false);
      }
    );
  }, [fetchWeather]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600">Fetching local weather...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={getLocation}>Try Again</Button>
      </Card>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Current Weather</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-5xl font-bold">{weather.current.temp.toFixed(1)}°C</p>
            <p className="text-gray-600 capitalize">{weather.current.description}</p>
          </div>
          <p className="text-6xl">{weather.current.icon}</p>
        </div>
        <p className="text-gray-600 mt-2">Humidity: {weather.current.humidity}%</p>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">3-Day Forecast</h2>
        <div className="space-y-3">
          {weather.daily.map((day) => (
            <div key={day.date.toISOString()} className="flex items-center justify-between border-b border-gray-200 pb-2 last:border-b-0">
              <p className="font-medium w-1/3">{formatDate(day.date)}</p>
              <p className="text-3xl w-1/6 text-center">{day.icon}</p>
              <div className="w-1/3 text-right">
                <span className="font-bold">{day.max.toFixed(0)}°</span>
                <span className="text-gray-500"> / {day.min.toFixed(0)}°</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default WeatherPage;
