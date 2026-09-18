// Live weather via Open-Meteo (free, no API key, CORS-enabled).
// https://open-meteo.com/en/docs
export interface LiveWeather {
  temperature: number;
  rainfall: number; // mm, summed over the last 7 days
}

export async function fetchLiveWeather(lat: number, lon: number): Promise<LiveWeather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Weather service unavailable. Please enter conditions manually.');
  }
  const data = await res.json();
  const temperature = data?.current?.temperature_2m;
  const rainfallDays: number[] = data?.daily?.precipitation_sum ?? [];
  const rainfall = rainfallDays.reduce((sum, v) => sum + (v ?? 0), 0);

  if (temperature === undefined) {
    throw new Error('Weather service returned no data for this location.');
  }
  return {
    temperature: Math.round(temperature * 10) / 10,
    rainfall: Math.round(rainfall * 10) / 10,
  };
}
