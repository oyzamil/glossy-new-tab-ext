export interface TimeState {
  hours: number;
  minutes: number;
  seconds: number;
  isAm: boolean;
}

export interface CalendarDay {
  dayNumber: number | null;
  isToday: boolean;
  isMarked?: boolean;
}

export type ClockType = 'analog' | 'digital';
export type LeftViewMode = 'clock' | 'weather';

export interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  timestamp: number;
}

export interface CachedWeather {
  data: WeatherData;
  timestamp: number;
}

export interface AppSettings {
  showCalendar: boolean;
  defaultClockType: ClockType;
  defaultViewMode: LeftViewMode;
}
