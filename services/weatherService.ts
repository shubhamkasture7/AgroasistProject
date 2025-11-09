
import { CurrentWeather, DailyWeather } from '../types';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const ICONS: { [key: string]: string } = {
  "Clear": "☀️",
  "Clouds": "☁️",
  "Rain": "🌧️",
  "Drizzle": "🌦️",
  "Thunderstorm": "⛈️",
  "Snow": "❄️",
};

export const getForecast = async (lat: number, lon: number): Promise<{ current: CurrentWeather, daily: DailyWeather[] }> => {
  console.log(`Fetching weather for lat: ${lat}, lon: ${lon}`);
  await delay(1500);

  const mockCurrent: CurrentWeather = {
    temp: 22.5,
    humidity: 65,
    description: 'Partly cloudy',
    icon: ICONS['Clouds'],
  };

  const mockDaily: DailyWeather[] = [
    {
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      min: 15,
      max: 25,
      description: 'Sunny',
      icon: ICONS['Clear'],
    },
    {
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      min: 14,
      max: 22,
      description: 'Chance of rain',
      icon: ICONS['Drizzle'],
    },
    {
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      min: 16,
      max: 26,
      description: 'Clear skies',
      icon: ICONS['Clear'],
    },
  ];

  return { current: mockCurrent, daily: mockDaily };
};
