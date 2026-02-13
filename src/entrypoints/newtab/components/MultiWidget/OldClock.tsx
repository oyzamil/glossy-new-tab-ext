import { useEffect, useState } from 'react';
import dayjs from 'dayjs';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const hours = time.format('hh');
  const minutes = time.format('mm');
  const seconds = time.format('ss');
  const meridiem = time.format('A');

  const dayName = time.format('dddd');
  const month = time.format('MMMM');
  const day = time.format('D');
  const year = time.format('YYYY');

  return (
    <div className="widget glass text-center">
      {/* TIME */}
      <div className="flex items-end justify-center gap-2 text-6xl font-light tracking-tight drop-shadow-2xl">
        <span className="hours">{hours}</span>
        <span className="colon">:</span>

        <span className="minutes">{minutes}</span>
        <span className="colon">:</span>

        <span className="seconds">{seconds}</span>

        <span className="meridiem ml-2 text-2xl">{meridiem}</span>
      </div>

      {/* DATE */}
      <div className="mt-2 flex justify-center gap-2 text-xl font-light opacity-80 drop-shadow-lg">
        <span className="day-name">{dayName},</span>
        <span className="month">{month}</span>
        <span className="day">{day},</span>
        <span className="year">{year}</span>
      </div>
    </div>
  );
};
