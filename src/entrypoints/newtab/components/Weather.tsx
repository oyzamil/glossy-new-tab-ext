import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  timestamp: number;
}

interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const API_KEY = '2985495cf18fe6ddde02bdd16f435fbe';

export const Weather: React.FC = () => {
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
    // Check if we have cached data first
    const cached = getCachedWeather();
    if (cached) {
      setWeather(cached);
      setPermissionStatus('granted');
      return;
    }

    // Check geolocation permission status
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (result.state === 'granted') {
        setPermissionStatus('granted');
        fetchWeatherData();
      } else if (result.state === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('prompt');
      }
    } catch (err) {
      // Fallback if permissions API not supported
      setPermissionStatus('prompt');
    }
  };

  const getCachedWeather = (): WeatherData | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedWeather = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid (within 30 minutes)
        if (now - parsedCache.timestamp < CACHE_DURATION) {
          console.log('Using cached weather data');
          return parsedCache.data;
        } else {
          console.log('Cache expired, will fetch fresh data');
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (err) {
      console.error('Error reading cache:', err);
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
    } catch (err) {
      console.error('Error setting cache:', err);
    }
  };

  const fetchWeatherData = async () => {
    // Check cache first
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
        // Permission denied
        setPermissionStatus('denied');
        setError('Location access denied. Please enable location permissions to see weather data.');
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
      console.error('Weather API error:', err);
      setError('Failed to fetch weather data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAllowPermission = () => {
    fetchWeatherData();
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

  // Render permission request UI
  if (permissionStatus === 'prompt' && !weather) {
    return (
      <div className="glass widget">
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <Icon className="text-4xl opacity-60" icon="wi:day-sunny" />
          <div className="text-center">
            <div className="mb-3 text-sm opacity-80">Allow location access to see weather</div>
            <button
              className="rounded-lg bg-white/10 px-4 py-2 text-sm transition-colors hover:bg-white/20 disabled:opacity-50"
              onClick={handleAllowPermission}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Allow Location'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render permission denied state
  if (permissionStatus === 'denied' || error) {
    return (
      <div className="glass widget">
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <Icon className="text-4xl opacity-60" icon="wi:na" />
          <div className="text-center">
            <div className="text-sm opacity-80">{error || 'Location permission denied'}</div>
            <button
              className="mt-3 rounded-lg bg-white/10 px-4 py-2 text-xs transition-colors hover:bg-white/20"
              onClick={handleAllowPermission}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render weather data
  return (
    <div className="glass widget">
      {loading && !weather ? (
        <Loader className="border-none bg-transparent" />
      ) : weather ? (
        <div className="flex items-center gap-4">
          <Icon className="text-5xl" icon={getWeatherIcon(weather.icon)} />
          <div>
            <div className="text-3xl font-light">
              {weather.temperature}°{navigator.languages.indexOf('en-US') === -1 ? 'C' : 'F'}
            </div>
            <div className="text-sm opacity-80">{weather.condition}</div>
            <div className="mt-1 text-xs opacity-60">{weather.location}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
