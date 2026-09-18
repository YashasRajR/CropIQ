// Live weather and soil moisture via Open-Meteo (free, no API key, CORS-enabled).
// Provides 2m ambient air temperature, recent observation rainfall, and root-zone soil moisture.
// Documentation: https://open-meteo.com/en/docs

export interface LiveWeather {
  temperature: number; // Celsius (°C)
  rainfall: number; // Recent precipitation depth (mm)
  soil_moisture?: number; // Volumetric root-zone soil moisture (%)
  rainfall_7d_total?: number; // 7-day cumulative precipitation (mm)
}

/**
 * Fetches live weather, recent rainfall, and root-zone soil moisture for field coordinates.
 */
export async function fetchLiveWeather(lat: number, lon: number): Promise<LiveWeather> {
  // Validate coordinates
  if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
    throw new Error('Please enter valid latitude and longitude coordinates.');
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Latitude must be between -90 and 90, and longitude between -180 and 180.');
  }

  // Request Open-Meteo with:
  // - current temperature at 2m
  // - current soil moisture at root-zone depths (3-9cm and 9-27cm)
  // - daily precipitation sums for past 7 days and today
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,rain,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm&daily=precipitation_sum&past_days=7&forecast_days=1&timezone=auto`;

  let data: Record<string, any>;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather service returned HTTP ${res.status}`);
    }
    data = await res.json();
  } catch (err) {
    throw new Error(
      'Live weather service is currently unreachable. Please check your connection or enter values manually.'
    );
  }

  const current = data?.current;
  const temperature = current?.temperature_2m;

  if (temperature === undefined || temperature === null || isNaN(temperature)) {
    throw new Error('Weather service returned no temperature data for this location.');
  }

  // 1. Root-zone soil moisture:
  // Open-Meteo provides volumetric soil water content in m³/m³ (e.g. 0.28 = 28% moisture).
  // The agricultural root zone is primarily 3-30 cm deep.
  let soilMoisture: number | undefined = undefined;
  const sm3 = current?.soil_moisture_3_to_9cm;
  const sm9 = current?.soil_moisture_9_to_27cm;

  if (typeof sm3 === 'number' && typeof sm9 === 'number' && !isNaN(sm3) && !isNaN(sm9)) {
    // Average between upper root zone (3-9cm) and lower root zone (9-27cm)
    const avgVolumetric = (sm3 + sm9) / 2;
    soilMoisture = Math.round(avgVolumetric * 1000) / 10;
  } else if (typeof sm3 === 'number' && !isNaN(sm3)) {
    soilMoisture = Math.round(sm3 * 1000) / 10;
  } else if (typeof sm9 === 'number' && !isNaN(sm9)) {
    soilMoisture = Math.round(sm9 * 1000) / 10;
  }

  // Clamp soil moisture to realistic agricultural bounds (0% to 100%)
  if (soilMoisture !== undefined) {
    soilMoisture = Math.max(0, Math.min(100, soilMoisture));
  }

  // 2. Recent Rainfall:
  // In the crop yield model, rainfall is the observation window precipitation depth
  // (training dataset median is 8.0 mm, 95th percentile is 15.8 mm, max is 93 mm).
  // Summing 8 full days in monsoon conditions yields 100-300 mm, which severely distorts model predictions.
  // Instead:
  // - We calculate recent 48-hour rainfall (yesterday + today, or last 2 completed days)
  // - If recent 48h was 0 mm but it rained earlier this week, we use the 7-day daily average
  // - We preserve the 7-day cumulative total for farmer information
  const dailySums: number[] = data?.daily?.precipitation_sum ?? [];
  const past7dTotal = dailySums.slice(0, 7).reduce((sum, v) => sum + (v ?? 0), 0);

  let recentRain = 0;
  if (dailySums.length >= 2) {
    const yesterday = dailySums[dailySums.length - 2] ?? 0;
    const today = dailySums[dailySums.length - 1] ?? 0;
    recentRain = yesterday + today;

    // If recent 48h is dry but past week had rainfall, use the 7-day daily average rate
    if (recentRain === 0 && past7dTotal > 0) {
      recentRain = past7dTotal / 7;
    }
  } else if (dailySums.length === 1) {
    recentRain = dailySums[0] ?? 0;
  }

  // Clamp to realistic observation window upper bound (max 45 mm)
  const calibratedRainfall = Math.min(45, Math.max(0, recentRain));

  return {
    temperature: Math.round(temperature * 10) / 10,
    rainfall: Math.round(calibratedRainfall * 10) / 10,
    soil_moisture: soilMoisture,
    rainfall_7d_total: Math.round(past7dTotal * 10) / 10,
  };
}
