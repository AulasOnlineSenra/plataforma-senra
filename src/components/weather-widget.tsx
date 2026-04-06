'use client';

import { useState, useEffect } from 'react';

type WeatherData = {
  city: string;
  temp: string;
  feelsLike: string;
  condition: string;
  icon: string;
  humidity: string;
  windKmph: string;
  maxTemp: string;
  minTemp: string;
};

const WEATHER_ICONS: Record<string, { icon: string; label: string }> = {
  '113': { icon: '☀️', label: 'Ensolarado' },
  '116': { icon: '⛅', label: 'Parcialmente nublado' },
  '119': { icon: '☁️', label: 'Nublado' },
  '122': { icon: '☁️', label: 'Encoberto' },
  '143': { icon: '🌫️', label: 'Nevoeiro' },
  '176': { icon: '🌦️', label: 'Possibilidade de chuva' },
  '200': { icon: '⛈️', label: 'Possibilidade de trovoada' },
  '227': { icon: '🌨️', label: 'Neve' },
  '230': { icon: '❄️', label: 'Nevasca' },
  '248': { icon: '🌫️', label: 'Nevoeiro' },
  '263': { icon: '🌦️', label: 'Chuvisco' },
  '266': { icon: '🌧️', label: 'Chuvisco' },
  '293': { icon: '🌦️', label: 'Chuva leve' },
  '296': { icon: '🌧️', label: 'Chuva leve' },
  '299': { icon: '🌧️', label: 'Chuva moderada' },
  '302': { icon: '🌧️', label: 'Chuva' },
  '305': { icon: '🌧️', label: 'Chuva forte' },
  '308': { icon: '🌧️', label: 'Chuva muito forte' },
  '323': { icon: '🌨️', label: 'Neve leve' },
  '329': { icon: '❄️', label: 'Neve' },
  '332': { icon: '❄️', label: 'Neve moderada' },
  '353': { icon: '🌦️', label: 'Chuva leve' },
  '356': { icon: '🌧️', label: 'Chuva moderada' },
  '359': { icon: '🌧️', label: 'Chuva forte' },
  '386': { icon: '⛈️', label: 'Trovoada com chuva' },
  '389': { icon: '⛈️', label: 'Trovoada com chuva' },
  '395': { icon: '⛈️', label: 'Trovoada com neve' },
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const locRes = await fetch('http://ip-api.com/json/?fields=city');
        if (!locRes.ok) throw new Error('Falha na geolocalização');
        const locData = await locRes.json();
        const city = locData.city || 'São Paulo';

        const weatherRes = await fetch(
          `https://wttr.in/${encodeURIComponent(city)}?format=j1`
        );
        if (!weatherRes.ok) throw new Error('Falha ao buscar clima');
        const weatherData = await weatherRes.json();

        const current = weatherData.current_condition?.[0];
        const today = weatherData.weather?.[0];
        if (!current || !today) throw new Error('Dados de clima indisponíveis');

        const code = current.weatherCode;
        const iconData = WEATHER_ICONS[code] || { icon: '🌡️', label: current.weatherDesc?.[0]?.value || 'Indisponível' };

        if (!cancelled) {
          setWeather({
            city,
            temp: current.temp_C,
            feelsLike: current.FeelsLikeC,
            condition: iconData.label,
            icon: iconData.icon,
            humidity: current.humidity,
            windKmph: current.windspeedKmph,
            maxTemp: today.maxtempC,
            minTemp: today.mintempC,
          });
        }
      } catch {
        // Silencioso
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchWeather();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="w-20 h-6 rounded bg-muted" />
            <div className="w-28 h-3 rounded bg-muted" />
          </div>
        </div>
        <div className="h-px bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="w-16 h-3 rounded bg-muted" />
              <div className="w-12 h-5 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl leading-none">{weather.icon}</span>
          <div>
            <div className="text-4xl font-bold text-foreground leading-none tracking-tight">
              {weather.temp}°
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {weather.city}
            </p>
          </div>
        </div>
        <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-3">
          {weather.condition}
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-5" />

      {/* Detalhes */}
      <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-4">
        <DetailItem label="Sensação" value={`${weather.feelsLike}°C`} />
        <DetailItem label="Vento" value={`${weather.windKmph} km/h`} />
        <DetailItem label="Umidade" value={`${weather.humidity}%`} />
        <DetailItem label="Máx / Mín" value={`${weather.maxTemp}° / ${weather.minTemp}°`} />
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground/60 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
    </div>
  );
}
