import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import dayjs, { Dayjs } from 'dayjs';
import Analog from './Analog';
import Calendar from './Calendar';
import { CalendarDay, TimeState } from './types';
import Weather from './Weather';

const SETTINGS_KEY = 'widget_config_v2';

const MultiWidget: React.FC = () => {
  const { settings, saveSettings } = useSettings();
  const [now, setNow] = useState<Dayjs>(dayjs());

  const time: TimeState = useMemo(
    () => ({
      hours: now.hour(),
      minutes: now.minute(),
      seconds: now.second(),
      isAm: now.hour() < 12,
    }),
    [now]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ================================
     Memoized Calendar
  ================================= */

  const calendarDays = useMemo<CalendarDay[]>(() => {
    const startOfMonth = now.startOf('month');
    const daysInMonth = now.daysInMonth();
    const firstDay = startOfMonth.day(); // 0 = Sunday
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;

    const days: CalendarDay[] = [];

    for (let i = 0; i < startOffset; i++) {
      days.push({ dayNumber: null, isToday: false });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        dayNumber: i,
        isToday: i === now.date(),
        isMarked: i === 21,
      });
    }

    return days;
  }, [now]);

  return (
    <div>
      <div className="font-outfit relative">
        {/* Toolbar */}
        <div className="flex-center absolute right-0 -bottom-10 left-0 z-50 gap-2 text-white">
          <Button
            className={cn(
              'glass border-none text-white',
              settings.multiWidgetMode === 'weather' && 'text-app-900 bg-white'
            )}
            shape="circle"
            icon={<Icon className="text-xl" icon="tabler:cloud" />}
            onClick={() => {
              saveSettings({ multiWidgetMode: 'weather' });
            }}
          />
          <Button
            className={cn(
              'glass border-none text-white',
              settings.multiWidgetMode === 'clock' && 'text-app-900 bg-white'
            )}
            shape="circle"
            icon={<Icon className="text-xl" icon="tabler:clock" />}
            onClick={() => {
              saveSettings({ multiWidgetMode: 'clock' });
            }}
          />
          <Button
            className={cn(
              'glass border-none text-white',
              settings.multiWidgetMode === 'calender' && 'text-app-900 bg-white'
            )}
            shape="circle"
            icon={<Icon className="text-xl" icon="stash:data-date" />}
            onClick={() => {
              saveSettings({ multiWidgetMode: 'calender' });
            }}
          />
        </div>

        {settings.multiWidgetMode === 'clock' && <Analog time={time} />}

        {settings.multiWidgetMode === 'calender' && (
          <Calendar days={calendarDays} currentDate={now.toDate()} />
        )}

        {settings.multiWidgetMode === 'weather' && <Weather />}
      </div>
    </div>
  );
};

export default MultiWidget;

// import dayjs from 'dayjs';
// import Analog from './Analog';
// import Digital from './Digital';

// export type WidgetMode = 'standard' | 'focused';
// export type ClockType = 'analog' | 'digital';
// export type SidebarType = 'calendar' | 'alarm' | 'none';

// export interface AlarmItem {
//   id: string;
//   time: string; // HH:mm
//   label: string;
//   isActive: boolean;
//   days: string[]; // e.g. ['Mon', 'Tue']
// }

// const ModernClock = () => {
//   const [time, setTime] = useState(dayjs());
//   const [clockType, setClockType] = useState<ClockType>('analog');
//   const [sidebarType, setSidebarType] = useState<SidebarType>('calendar');

// useEffect(() => {
//   const timer = setInterval(() => {
//     setTime(dayjs());
//   }, 1000);
//   return () => clearInterval(timer);
// }, []);

//   const isAnalogCompact = sidebarType === 'none' && clockType === 'analog';

//   return (
//     <>
//       {clockType === 'analog' ? (
//         <Analog time={time} compact={isAnalogCompact} />
//       ) : (
//         <Digital time={time} />
//       )}
//       {/* <motion.div className={'flex min-w-0 flex-1 items-center justify-center'} layout>
//         <AnimatePresence mode="wait">
//           <motion.div
//             className="flex h-full w-full items-center justify-center"
//             key={clockType + (sidebarType === 'none' ? '-compact' : '')}
//             initial={{ scale: 0.85, opacity: 0, filter: 'blur(20px)' }}
//             animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
//             exit={{ scale: 1.15, opacity: 0, filter: 'blur(20px)' }}
//             transition={{ duration: 0.6 }}
//           >
//             {clockType === 'analog' ? (
//               <Analog time={time} compact={isAnalogCompact} />
//             ) : (
//               <Digital time={time} />
//             )}
//           </motion.div>
//         </AnimatePresence>
//       </motion.div> */}
//     </>
//   );
// };

// export default ModernClock;
