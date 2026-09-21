/**
 * Open-Meteo Weather Service (Free, No API Key, Privacy Friendly)
 */

export interface FamilyWeather {
  temperature: number;
  condition: string;
  icon: string;
  familyTip: string;
  tempMax?: number;
  tempMin?: number;
}

const WMO_CODE_MAP: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Klar & Sonnig', icon: '☀️' },
  1: { condition: 'Überwiegend sonnig', icon: '🌤️' },
  2: { condition: 'Teilweise bewölkt', icon: '⛅' },
  3: { condition: 'Bewölkt', icon: '☁️' },
  45: { condition: 'Nebel', icon: '🌫️' },
  48: { condition: 'Raureif-Nebel', icon: '🌫️' },
  51: { condition: 'Leichter Nieselregen', icon: '🌦️' },
  53: { condition: 'Nieselregen', icon: '🌦️' },
  55: { condition: 'Dichter Nieselregen', icon: '🌧️' },
  61: { condition: 'Leichter Regen', icon: '🌧️' },
  63: { condition: 'Mäßiger Regen', icon: '🌧️' },
  65: { condition: 'Starker Regen', icon: '🌧️' },
  71: { condition: 'Leichter Schneefall', icon: '🌨️' },
  73: { condition: 'Schneefall', icon: '❄️' },
  75: { condition: 'Dichter Schneefall', icon: '❄️' },
  80: { condition: 'Regenschauer', icon: '🌦️' },
  81: { condition: 'Kräftige Schauer', icon: '🌧️' },
  82: { condition: 'Heftige Schauer', icon: '⛈️' },
  95: { condition: 'Gewitter', icon: '⛈️' },
};

function getFamilyClothingTip(temp: number, wmoCode: number): string {
  const isRain = [51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(wmoCode);
  const isSnow = [71, 73, 75].includes(wmoCode);

  if (isSnow) {
    return 'Schnee & Kälte – Winterstiefel, Mütze und dicker Schneeanzug!';
  }
  if (isRain) {
    return temp > 15
      ? 'Regenschauer bei milder Luft – Leichte Regenjacke und Schirm!'
      : 'Nass und kühl – Gummistiefel und warme Regenjacke für die Kinder!';
  }
  if (temp >= 25) {
    return 'Herrliches Sommerwetter – Kurze Hosen, Sonnenhut und Sonnencreme!';
  }
  if (temp >= 19) {
    return 'Angenehm warm – Perfekt für den Spielplatz oder Sport im T-Shirt!';
  }
  if (temp >= 13) {
    return 'Milde Frühlingsluft – Eine Übergangsjacke oder Pulli reicht aus.';
  }
  if (temp >= 5) {
    return 'Frisch draußen – Jacke und Halstuch für die Schule einpacken.';
  }
  return 'Eisig kalt – Dicke Winterjacke, Schal und Handschuhe nicht vergessen!';
}

export async function fetchFamilyWeather(
  latitude: number = 52.52,
  longitude: number = 13.405
): Promise<FamilyWeather> {
  const cacheKey = `famly_weather_${latitude.toFixed(2)}_${longitude.toFixed(2)}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
        return parsed.data;
      }
    } catch {
      // ignore
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FBerlin`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Weather API error');

    const json = await res.json();
    const current = json.current_weather;
    const daily = json.daily;

    const wmo = current.weathercode;
    const weatherInfo = WMO_CODE_MAP[wmo] || { condition: 'Heiter', icon: '🌤️' };
    const temp = Math.round(current.temperature);
    const tempMax = daily?.temperature_2m_max?.[0] ? Math.round(daily.temperature_2m_max[0]) : undefined;
    const tempMin = daily?.temperature_2m_min?.[0] ? Math.round(daily.temperature_2m_min[0]) : undefined;

    const weatherData: FamilyWeather = {
      temperature: temp,
      condition: weatherInfo.condition,
      icon: weatherInfo.icon,
      familyTip: getFamilyClothingTip(temp, wmo),
      tempMax,
      tempMin,
    };

    sessionStorage.setItem(
      cacheKey,
      JSON.stringify({ timestamp: Date.now(), data: weatherData })
    );

    return weatherData;
  } catch (err) {
    // Graceful offline fallback
    return {
      temperature: 20,
      condition: 'Angenehm',
      icon: '🌤️',
      familyTip: 'Schöner Tag für gemeinsame Familienaktivitäten!',
    };
  }
}
