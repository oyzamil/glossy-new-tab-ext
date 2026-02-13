import dayjs from 'dayjs';
import { motion } from 'framer-motion';

interface DigitalProps {}

const Digital: React.FC<DigitalProps> = () => {
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.format('hh');
  const minutes = time.format('mm');
  const seconds = time.format('ss');
  const ampm = time.format('A');
  const dateStr = time.format('dddd, DD MMMM');

  return (
    <div
      className="font-outfit flex-col-center mb-5 scale-140 gap-5 overflow-hidden py-6 select-none"
    >
      <div className="flex-center relative">
        {/* Hour Group */}
        <motion.span
          className="text-7xl leading-none font-black"
          key={hours}
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {hours}
        </motion.span>

        {/* Separator */}
        <span className="animate-pulse px-1 text-4xl leading-none font-black">:</span>

        {/* Minute Group */}
        <motion.span
          className="text-app-200 text-7xl leading-none font-black"
          key={minutes}
          initial={{ y: 25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          {minutes}
        </motion.span>

        {/* Side Complications (AM/PM and Seconds) */}
        <div className="flex-col-center ml-3 gap-1">
          <span className="text-lg leading-none font-black tabular-nums">{seconds}</span>
          <span className="leading-none font-bold">{ampm}</span>
        </div>
      </div>

      {/* Date Bar */}
      <motion.div
        className="flex items-center gap-6 opacity-40"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-theme h-px w-16" />
        <p className="text-[10px] font-black tracking-[0.5em] whitespace-nowrap uppercase">
          {dateStr}
        </p>
        <div className="bg-theme h-px w-16" />
      </motion.div>
    </div>
  );
};

export default Digital;
