import dayjs from 'dayjs';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="widget glass text-center">
      <div className="font-digital text-8xl font-light tracking-tight drop-shadow-2xl">
        {time.format('HH:mm')}
      </div>
      <div className="text-xl font-light opacity-80 drop-shadow-lg">
        {time.format('dddd, MMMM D, YYYY')}
      </div>
    </div>
  );
};
