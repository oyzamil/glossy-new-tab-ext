import { config } from '@/app.config';
import { motion } from 'framer-motion';
import { TimeState } from './types';

interface ClockFaceProps {
  time: TimeState;
}

const themePrimary = config.APP.color;

const Analog: React.FC<ClockFaceProps> = ({ time }) => {
  const { hours, minutes, seconds, isAm } = time;

  const secDeg = (seconds / 60) * 360;
  const minDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = (((hours % 12) + minutes / 60) / 12) * 360;

  const markers = Array.from({ length: 60 }).map((_, i) => {
    const angle = i * 6 * (Math.PI / 180);
    const isMajor = i % 5 === 0;
    const isQuarter = i % 15 === 0;
    const length = isMajor ? 8 : 4;
    const thickness = isMajor ? 2.5 : 1;

    const x1 = 100 + 88 * Math.sin(angle);
    const y1 = 100 - 88 * Math.cos(angle);
    const x2 = 100 + (88 - length) * Math.sin(angle);
    const y2 = 100 - (88 - length) * Math.cos(angle);

    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isQuarter ? themePrimary : isMajor ? '#ffffff60' : '#ffffff20'}
        strokeWidth={thickness}
        strokeLinecap="round"
      />
    );
  });

  return (
    <motion.div
      className="glass relative size-45 overflow-hidden rounded-full"
      key={'analog'}
      initial={{ y: 25, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <svg viewBox="0 0 200 200">
        {/* Main circular background */}
        <circle cx="100" cy="100" r="93" fill="transparent" />

        {/* Ticks */}
        {markers}

        {/* Large Numbers */}
        <text x="100" y="38" fontSize="20" fontWeight="700" textAnchor="middle" fill="white">
          12
        </text>
        <text x="168" y="108" fontSize="20" fontWeight="700" textAnchor="middle" fill="white">
          3
        </text>
        <text x="100" y="175" fontSize="20" fontWeight="700" textAnchor="middle" fill="white">
          6
        </text>
        <text x="32" y="108" fontSize="20" fontWeight="700" textAnchor="middle" fill="white">
          9
        </text>

        {/* Small Grey Numbers */}
        <g fill="#4b5563" fontSize="12" fontWeight="600" textAnchor="middle">
          <text x="135" y="48">
            1
          </text>
          <text x="162" y="74">
            2
          </text>
          <text x="162" y="142">
            4
          </text>
          <text x="135" y="168">
            5
          </text>
          <text x="65" y="168">
            7
          </text>
          <text x="38" y="142">
            8
          </text>
          <text x="38" y="74">
            10
          </text>
          <text x="65" y="48">
            11
          </text>
        </g>

        {/* Sun/Moon Arc Background */}
        <path
          d="M 60 100 A 40 40 0 0 1 140 100"
          fill="none"
          stroke="#1f1f1f"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Progress Arc */}
        <path
          d="M 60 100 A 40 40 0 0 1 90 61"
          fill="none"
          stroke={themePrimary}
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Sun Indicator */}
        <circle cx="90" cy="61" r="5" fill="white" />

        {/* Icons */}
        <g transform="translate(52, 107) scale(0.6)" opacity="0.3">
          <circle cx="12" cy="12" r="5" fill="white" />
          <path
            d="M12 2V5M12 19V22M2 12H5M19 12H22M4.93 4.93L7.05 7.05M16.95 16.95L19.07 19.07M4.93 19.07L7.05 16.95M16.95 7.05L19.07 4.93"
            stroke="white"
            strokeWidth="2"
          />
        </g>
        <g transform="translate(132, 106) scale(0.6)" opacity="0.3">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="white" />
        </g>

        {/* AM/PM Indicator Pill */}
        <rect x="75" y="130" width="50" height="22" rx="11" fill="#1f1f1f" />
        <text
          x="100"
          y="146"
          fontSize="11"
          fontWeight="700"
          textAnchor="middle"
          style={{ letterSpacing: '0.5px' }}
        >
          <tspan fill={isAm ? themePrimary : '#4b5563'}>AM</tspan>
          <tspan fill={!isAm ? themePrimary : '#4b5563'} dx="4">
            PM
          </tspan>
        </text>

        {/* Hands */}
        <line
          x1="100"
          y1="100"
          x2={100 + 38 * Math.sin((hourDeg * Math.PI) / 180)}
          y2={100 - 38 * Math.cos((hourDeg * Math.PI) / 180)}
          stroke="white"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
        <line
          x1="100"
          y1="100"
          x2={100 + 62 * Math.sin((minDeg * Math.PI) / 180)}
          y2={100 - 62 * Math.cos((minDeg * Math.PI) / 180)}
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="100"
          y1="100"
          x2={100 + 78 * Math.sin((secDeg * Math.PI) / 180)}
          y2={100 - 78 * Math.cos((secDeg * Math.PI) / 180)}
          stroke={themePrimary}
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <circle cx="100" cy="100" r="5" fill={themePrimary} />
        <circle cx="100" cy="100" r="1.5" fill="#000" />
      </svg>
    </motion.div>
  );
};

export default Analog;
