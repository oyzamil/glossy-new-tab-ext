import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { CachedWeather, WeatherData } from './types';

const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const API_KEY = '2985495cf18fe6ddde02bdd16f435fbe';

const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>(
    'prompt'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkInitialPermission();
  }, []);

  const checkInitialPermission = async () => {
    const cached = getCachedWeather();
    if (cached) {
      setWeather(cached);
      setPermissionStatus('granted');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as any });
      if (result.state === 'granted') {
        setPermissionStatus('granted');
        fetchWeatherData();
      } else if (result.state === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('prompt');
      }
    } catch (err) {
      setPermissionStatus('prompt');
    }
  };

  const getCachedWeather = (): WeatherData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedWeather = JSON.parse(cached);
        const now = Date.now();
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          return parsedCache.data;
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (err) {
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  };

  const setCachedWeather = (data: WeatherData) => {
    try {
      const cacheData: CachedWeather = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {}
  };

  const fetchWeatherData = async () => {
    const cached = getCachedWeather();
    if (cached) {
      setWeather(cached);
      setPermissionStatus('granted');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      await fetchWeatherForCoords(position.coords.latitude, position.coords.longitude);
      setPermissionStatus('granted');
    } catch (err: any) {
      if (err.code === 1) {
        setPermissionStatus('denied');
        setError('Location access denied. Please enable location permissions.');
      } else {
        setError('Unable to get your location. Please try again.');
      }
      setLoading(false);
    }
  };

  const fetchWeatherForCoords = async (lat: number, lon: number) => {
    const isMetric = navigator.languages.indexOf('en-US') === -1;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${isMetric ? 'metric' : 'imperial'}&lang=en`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      if (data.main && data.weather && data.weather.length > 0) {
        const weatherData: WeatherData = {
          temperature: Math.round(data.main.temp),
          condition: data.weather[0].description
            .split(' ')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          location: `${data.name}${data.sys?.country ? ', ' + data.sys.country : ''}`,
          icon: mapOpenWeatherIcon(data.weather[0].icon),
          humidity: data.main.humidity,
          windSpeed: Math.round(data.wind?.speed || 0),
          pressure: data.main.pressure,
          timestamp: Date.now(),
        };

        setWeather(weatherData);
        setCachedWeather(weatherData);
      }
    } catch (err: any) {
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const mapOpenWeatherIcon = (iconCode: string): string => {
    const iconMap: Record<string, string> = {
      '01d': 'clear-day',
      '01n': 'clear-day',
      '02d': 'partly-cloudy-day',
      '02n': 'partly-cloudy-day',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rain',
      '09n': 'rain',
      '10d': 'rain',
      '10n': 'rain',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'cloudy',
      '50n': 'cloudy',
    };
    return iconMap[iconCode] || 'clear-day';
  };

  const getWeatherIcon = (condition: string): string => {
    const iconMap: Record<string, string> = {
      'clear-day': 'wi:day-sunny',
      'partly-cloudy-day': 'wi:day-cloudy',
      cloudy: 'wi:cloudy',
      rain: 'wi:rain',
      snow: 'wi:snow',
      thunderstorm: 'wi:thunderstorm',
    };
    return iconMap[condition] || 'wi:day-sunny';
  };

  if (permissionStatus === 'prompt' && !weather) {
    return (
      <div className="glass widget animate-fadeIn flex-col-center flex h-full min-h-40">
        <Icon className="text-5xl opacity-30" icon="wi:day-sunny" />
        <div className="text-center">
          <div className="mb-3 text-sm opacity-60">Allow location access for weather</div>
          <button
            className="rounded-full bg-white/10 px-6 py-2 text-sm font-medium transition-colors hover:bg-white/20 active:scale-95"
            onClick={fetchWeatherData}
            disabled={loading}
          >
            {loading ? 'Requesting...' : 'Allow Location'}
          </button>
        </div>
      </div>
    );
  }

  if ((permissionStatus === 'denied' || error) && !weather) {
    return (
      <div className="glass widget flex-col-center flex h-full min-h-40">
        <Icon className="text-5xl opacity-30" icon="wi:na" />
        <div className="px-6 text-center">
          <div className="text-sm leading-relaxed opacity-60">
            {error || 'Location access denied'}
          </div>
          <button
            className="mt-4 rounded-full bg-white/10 px-6 py-2 text-sm font-medium transition-colors hover:bg-white/20 active:scale-95"
            onClick={fetchWeatherData}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && !weather) {
    return (
      <div className="glass widget flex h-full min-h-40 items-center justify-center">
        <div
          className="border-t-app-500 h-10 w-10 animate-spin rounded-full border-2 border-white/10"
        ></div>
      </div>
    );
  }

  return (
    <div className="glass widget">
      {weather && (
        <>
          {/* Header  */}
          <motion.span
            className="flex-center -mt-4 text-7xl font-bold"
            key={weather.temperature}
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <Icon className="text-8xl" icon={getWeatherIcon(weather.icon)} /> {weather.temperature}°
          </motion.span>

          {/* Body  */}
          <motion.span
            className="flex-center -mt-3 gap-2"
            key={weather.condition}
            initial={{ y: 25, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h3 className="text-app-300 text-2xl font-semibold">{weather.condition}</h3>
            <p className="font-medium text-white/40">{weather.location}</p>
          </motion.span>

          {/* Footer  */}
          <div className="flex-center mt-3 w-full gap-4 text-sm font-medium">
            <motion.span
              className="flex-col-center"
              key={weather.humidity}
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                Humidity
              </span>
              <span className="text-lg">{weather.humidity}%</span>
            </motion.span>

            <motion.span
              className="flex-col-center"
              key={weather.windSpeed}
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                Wind
              </span>
              <span className="text-lg">
                {weather.windSpeed} <span className="text-xs">m/s</span>
              </span>
            </motion.span>

            <motion.span
              className="flex-col-center"
              key={weather.pressure}
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">
                Pressure
              </span>
              <span className="text-lg">
                {weather.pressure} <span className="text-xs">hPa</span>
              </span>
            </motion.span>
          </div>
        </>
      )}
    </div>
  );
};

export default Weather;
