import { Icon } from '@iconify/react';

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  icon: string;
}

export const Weather: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated weather data - in production, integrate with a weather API
    // You can use OpenWeatherMap, WeatherAPI, etc.
    const fetchWeather = async () => {
      try {
        // Get user's location
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // For demo purposes, using mock data
            // In production, fetch from weather API using position.coords
            const mockWeather: WeatherData = {
              temperature: 22,
              condition: 'Partly Cloudy',
              location: 'San Francisco',
              icon: 'partly-cloudy-day',
            };
            setWeather(mockWeather);
            setLoading(false);
          },
          () => {
            // If location denied, use default location
            setWeather({
              temperature: 20,
              condition: 'Clear',
              location: 'Unknown',
              icon: 'clear-day',
            });
            setLoading(false);
          }
        );
      } catch (error) {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

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

  if (!weather) return null;

  return (
    <div className="glass widget">
      {loading ? (
        <Loader className="border-none bg-transparent" />
      ) : (
        <div className="flex items-center gap-4">
          <Icon className="text-5xl" icon={getWeatherIcon(weather.icon)} />
          <div>
            <div className="text-3xl font-light">{weather.temperature}°C</div>
            <div className="text-sm opacity-80">{weather.condition}</div>
            <div className="mt-1 text-xs opacity-60">{weather.location}</div>
          </div>
        </div>
      )}
    </div>
  );
};
