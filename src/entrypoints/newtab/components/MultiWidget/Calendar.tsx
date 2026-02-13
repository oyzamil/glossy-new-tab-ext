import { motion } from 'framer-motion';
import { CalendarDay } from './types';

interface CalendarProps {
  days: CalendarDay[];
  currentDate: Date;
}

const Calendar: React.FC<CalendarProps> = ({ days, currentDate }) => {
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Format as "December 13, 2023" per screenshot
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();
  const day = currentDate.getDate();

  return (
    <div className="glass widget flex h-full max-w-65 flex-col p-3 select-none">
      <motion.div
        className="mb-2"
        key={'calander-header'}
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h2 className="text-center text-[13px] font-semibold tracking-tight text-white">
          {monthName} {day}, {year}
        </h2>
      </motion.div>

      <motion.div
        className="glass overflow-hidden rounded-md px-1 py-1.5"
        key={'calander-weekdays'}
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="grid grid-cols-7 text-center">
          {weekDays.map((wd, i) => (
            <div className="text-[10px] font-bold tracking-wider uppercase" key={i}>
              {wd}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className="grid grow grid-cols-7 gap-y-1 text-center"
        key={'calander-days'}
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        {days.map((d, i) => (
          <div className="relative flex items-center justify-center" key={i}>
            {d.dayNumber && (
              <span
                className={cn(
                  'glass z-10 size-6 rounded-md',
                  d.isToday ? 'bg-app-500' : 'text-[#f0f0f0]',
                  d.isMarked && 'underline'
                )}
              >
                <span>{d.dayNumber}</span>
              </span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default Calendar;
