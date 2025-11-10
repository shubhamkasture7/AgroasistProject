const API_KEY =
  (import.meta as any)?.env?.VITE_OPENWEATHER_API_KEY ||
  (process.env as any)?.REACT_APP_OPENWEATHER_API_KEY || "729822c59ba2e5de0c03f278866687f5";

const BASE = "https://api.openweathermap.org/data/2.5";
const REVERSE_GEOCODE_URL = "https://api.openweathermap.org/geo/1.0/reverse";

export type Forecast = {
  current: {
    temp: number;
    humidity: number;
    wind_speed: number;
    description: string;
  };
  daily: {
    date: Date;
    max: number;
    min: number;
    description: string; // most frequent description that day
  }[];
};

async function fetchJson(url: string) {
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try { msg = (JSON.parse(text)?.message as string) || text; } catch {}
    throw new Error(`${res.status} ${res.statusText} — ${msg}`);
  }
  return JSON.parse(text);
}

// Turn 3-hourly forecast into next 3 calendar days (exclude today)
function toThreeDayDaily(list: any[]): Forecast["daily"] {
  const byDate: Record<string, { max: number; min: number; descCount: Record<string, number> }> = {};

  for (const item of list) {
    const dt = new Date(item.dt * 1000);
    const dayKey = dt.toISOString().slice(0, 10); // YYYY-MM-DD
    const temp = item.main?.temp ?? 0;
    const desc = item.weather?.[0]?.description ?? "—";

    if (!byDate[dayKey]) {
      byDate[dayKey] = { max: temp, min: temp, descCount: {} };
    }
    byDate[dayKey].max = Math.max(byDate[dayKey].max, temp);
    byDate[dayKey].min = Math.min(byDate[dayKey].min, temp);
    byDate[dayKey].descCount[desc] = (byDate[dayKey].descCount[desc] || 0) + 1;
  }

  // exclude today
  const todayKey = new Date().toISOString().slice(0, 10);
  const entries = Object.entries(byDate)
    .filter(([k]) => k !== todayKey)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .slice(0, 3);

  return entries.map(([k, v]) => {
    const topDesc = Object.entries(v.descCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
    return { date: new Date(k), max: v.max, min: v.min, description: topDesc };
  });
}

export async function getForecast(lat: number, lon: number): Promise<Forecast> {
  if (!API_KEY) throw new Error("Missing OpenWeather API key (.env)");

  // current weather
  const currentUrl = `${BASE}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const current = await fetchJson(currentUrl);

  // 5-day / 3-hour forecast
  const forecastUrl = `${BASE}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
  const forecast = await fetchJson(forecastUrl);

  return {
    current: {
      temp: current.main?.temp ?? 0,
      humidity: current.main?.humidity ?? 0,
      wind_speed: current.wind?.speed ?? 0,
      description: current.weather?.[0]?.description ?? "—",
    },
    daily: toThreeDayDaily(forecast.list || []),
  };
}

export async function getLocationName(lat: number, lon: number): Promise<string> {
  if (!API_KEY) return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  const url = `${REVERSE_GEOCODE_URL}?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
  try {
    const arr = await fetchJson(url);
    const { name, state, country } = (arr?.[0] || {}) as { name?: string; state?: string; country?: string };
    return [name, state, country].filter(Boolean).join(", ") || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
  }
}
