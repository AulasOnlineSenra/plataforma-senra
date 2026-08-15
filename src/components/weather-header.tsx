'use client';

import { useState, useEffect } from 'react';

export default function WeatherHeader() {
  const [data, setData] = useState<{ state: string; temp: string; icon: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchWeather() {
      try {
        const locRes = await fetch('http://ip-api.com/json/?fields=city,region');
        if (!locRes.ok) throw new Error('Falha na geolocalização');
        const locData = await locRes.json();
        const city = locData.city || 'São Paulo';
        const state = locData.region || 'SP';

        const weatherRes = await fetch(
          `https://wttr.in/${encodeURIComponent(city)}?format=j1`
        );
        if (!weatherRes.ok) throw new Error('Falha ao buscar clima');
        const weatherData = await weatherRes.json();

        const current = weatherData.current_condition?.[0];
        
        // Simple mapping for icon based on weatherCode if desired, or just use temp
        // WTTR.in format j1 provides current_condition[0].temp_C
        if (!cancelled && current) {
          setData({ state, temp: current.temp_C, icon: '🌡️' });
        }
      } catch {
        // Silencioso
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-full drop-shadow-md border border-white/10">
      <span>{data.state}</span>
      <span className="w-1 h-1 rounded-full bg-white/50" />
      <span>{data.temp}°C</span>
    </div>
  );
}
