import React, { useState, useEffect, useCallback } from 'react';
import { getForecast, getLocationName } from '../services/weatherService';
import { getCurrentUserName } from '../services/userService';
import { CurrentWeather, DailyWeather } from '../types';
import {
  Leaf, // greeting chip
  Droplets, // humidity
  Wind,    // wind
  CloudRain, // rainfall
  Sun, CloudSun, Cloud, CloudDrizzle, CloudRain as CloudRainBig,
  ChevronRight,
  ClipboardList, Sprout
} from 'lucide-react';

const WeatherPage: React.FC = () => {
  const [weather, setWeather] = useState<{ current: CurrentWeather; daily: DailyWeather[] } | null>(null);
  const [place, setPlace] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('शेतीकरी');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'शुभ प्रभात';
    if (h < 18) return 'शुभ दुपार';
    return 'शुभ संध्याकाळ';
  })();

  const fetchAll = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    setDebug(null);
    try {
      const [f, name, userName] = await Promise.all([
        getForecast(lat, lon),
        getLocationName(lat, lon),
        getCurrentUserName(),
      ]);
      setWeather(f);
      setPlace(name);
      setDisplayName(userName || 'शेतीकरी');
    } catch (e: any) {
      setError('हवामान माहितीत अडचण आली. कृपया पुन्हा प्रयत्न करा.');
      setDebug(String(e?.message || e));
      setWeather(null);
      setPlace('');
    } finally {
      setLoading(false);
    }
  }, []);

  const getLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    setDebug(null);
    if (!navigator.geolocation) {
      setError('तुमच्या ब्राउझरमध्ये लोकेशन सुविधा उपलब्ध नाही.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => fetchAll(position.coords.latitude, position.coords.longitude),
      () => {
        setError('लोकेशन मिळत नाही. कृपया लोकेशन सेवा सुरू करा.');
        setLoading(false);
      }
    );
  }, [fetchAll]);

  // Quick sample (Mumbai) to verify UI without GPS
  const useSample = () => fetchAll(19.0760, 72.8777);

  useEffect(() => { getLocation(); }, [getLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="h-24 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-red-500 mb-3">{error}</p>

          {debug && (
            <details className="mb-4 text-sm text-gray-600">
              <summary className="cursor-pointer">त्रुटीची सविस्तर माहिती दाखवा</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-left bg-gray-50 p-3 rounded">
                {debug}
              </pre>
            </details>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={getLocation}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium"
            >
              पुन्हा प्रयत्न करा
            </button>
            <button
              onClick={useSample}
              className="bg-gray-200 text-gray-900 px-6 py-2 rounded-lg font-medium"
            >
              नमुना वापरा (मुंबई)
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            सूचना: <code>VITE_OPENWEATHER_API_KEY</code> योग्य सेट केले आहे याची खात्री करा आणि geolocation साठी HTTPS वापरा.
          </p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  // crude rainfall pickup if available (OpenWeather current "rain" may hold 1h volume)
  const rainfall =
    (weather as any).current?.rain_1h ??
    (weather as any).current?.rain ??
    0;

  // choose an icon for the big weather card
  const bigIcon = (() => {
    const d = (weather.current.description || '').toLowerCase();
    if (d.includes('rain')) return <CloudRainBig className="w-10 h-10 opacity-90" />;
    if (d.includes('drizzle')) return <CloudDrizzle className="w-10 h-10 opacity-90" />;
    if (d.includes('cloud')) return <CloudSun className="w-10 h-10 opacity-90" />;
    return <Sun className="w-10 h-10 opacity-90" />;
  })();

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-md mx-auto space-y-6">

        {/* Greeting Chip */}
        <div className="rounded-2xl bg-gradient-to-r from-green-600 to-green-500 text-white p-4 flex items-center gap-3 shadow">
          <div className="bg-white/20 rounded-full p-2">
            <Leaf className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm opacity-90">{greeting}</div>
            <div className="text-lg font-semibold">{displayName}</div>
          </div>
        </div>

        {/* Big Weather Card */}
        <div
          className="relative rounded-3xl p-5 text-white shadow-xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)' }}
        >
          {/* subtle shapes */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-3xl rotate-12" />
          <div className="absolute top-6 right-6 text-white/70">{bigIcon}</div>

          <div className="text-sm text-white/90">आजचे हवामान</div>
          <div className="text-xs text-white/80 mb-3">{place || 'आपले ठिकाण'}</div>

          <div className="flex items-end gap-3">
            <div className="text-5xl font-extrabold leading-none">
              {weather.current.temp.toFixed(0)}°C
            </div>
            <div className="text-base capitalize mb-1 opacity-95">
              {weather.current.description}
            </div>
          </div>

          {/* Stat Pills */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/15 backdrop-blur p-3 text-center">
              <div className="flex justify-center mb-1"><Droplets className="w-5 h-5" /></div>
              <div className="text-xs opacity-90">आर्द्रता</div>
              <div className="text-sm font-semibold">{weather.current.humidity}%</div>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur p-3 text-center">
              <div className="flex justify-center mb-1"><Wind className="w-5 h-5" /></div>
              <div className="text-xs opacity-90">वारा</div>
              <div className="text-sm font-semibold">
                {Number.isFinite(weather.current.wind_speed)
                  ? weather.current.wind_speed.toFixed(0)
                  : '—'}{' '}
                किमी/तास
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 backdrop-blur p-3 text-center">
              <div className="flex justify-center mb-1"><CloudRain className="w-5 h-5" /></div>
              <div className="text-xs opacity-90">पाऊस</div>
              <div className="text-sm font-semibold">
                {rainfall?.toFixed ? rainfall.toFixed(0) : rainfall} मिमी
              </div>
            </div>
          </div>
        </div>

        {/* 3-Day Forecast */}
        <div>
          <div className="text-gray-900 font-semibold mb-3">३ दिवसांचे अंदाज</div>
          <div className="grid grid-cols-3 gap-3">
            {weather.daily.slice(0, 3).map((day, index) => {
              const label =
                index === 0
                  ? 'उद्या'
                  : day.date.toLocaleDateString(undefined, { weekday: 'short' });
              const icon = (() => {
                const d = day.description.toLowerCase();
                if (d.includes('rain')) return <CloudRain className="w-5 h-5" />;
                if (d.includes('drizzle')) return <CloudDrizzle className="w-5 h-5" />;
                if (d.includes('cloud')) return <Cloud className="w-5 h-5" />;
                return <Sun className="w-5 h-5" />;
              })();
              return (
                <div
                  key={day.date.toISOString()}
                  className="rounded-2xl border border-gray-200 bg-white p-3 text-center shadow-sm"
                >
                  <div className="text-xs text-gray-600 mb-1">{label}</div>
                  <div className="flex justify-center mb-1">{icon}</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {day.max.toFixed(0)}°C
                  </div>
                  <div className="text-[11px] text-gray-500 capitalize">
                    {day.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="text-gray-900 font-semibold mb-3">जलद क्रिया</div>
          <div className="grid grid-cols-2 gap-4">
            <button className="rounded-2xl bg-green-600 text-white p-4 text-left shadow hover:opacity-95 transition">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 rounded-xl p-2">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 font-semibold">कीटकनाशक नोंद</div>
              <div className="text-sm opacity-90">वापराची नोंद ठेवा</div>
            </button>

            <button className="rounded-2xl bg-orange-500 text-white p-4 text-left shadow hover:opacity-95 transition">
              <div className="flex items-center justify-between">
                <div className="bg-white/20 rounded-xl p-2">
                  <Sprout className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 font-semibold">पीक मार्गदर्शन</div>
              <div className="text-sm opacity-90">सल्ला मिळवा</div>
            </button>
          </div>
        </div>

        {/* Recent Logs (static placeholders) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-gray-900 font-semibold">अलीकडील नोंदी</div>
            <button className="text-green-600 text-sm font-medium">सर्व पहा</button>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-3 flex items-center gap-3 shadow-sm">
            <div className="rounded-xl bg-green-100 p-2">
              <ClipboardList className="w-5 h-5 text-green-700" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">सायपरमेथ्रिन 10% EC</div>
              <div className="text-xs text-gray-600">फवारणी तारीख: १६ मे २०२४</div>
              <div className="text-xs text-gray-600">शेत A • कापूस पीक</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-3 flex items-center gap-3 shadow-sm">
            <div className="rounded-xl bg-indigo-100 p-2">
              <ClipboardList className="w-5 h-5 text-indigo-700" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">इमिडाक्लोप्रिड 17.8% SL</div>
              <div className="text-xs text-gray-600">फवारणी तारीख: १० मे २०२४</div>
              <div className="text-xs text-gray-600">शेत B • गहू पीक</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default WeatherPage;
