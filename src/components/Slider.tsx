import type { SliderSingleProps } from 'antd';
import { Slider } from 'antd';

interface ProgressSliderProps {
  currentTime: number;
  duration: number;
  onChange: (value: number) => void;
}

export default function ProgressSlider({ currentTime, duration, onChange }: ProgressSliderProps) {
  const value = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleChange: SliderSingleProps['onChange'] = (val) => {
    if (typeof val === 'number') {
      onChange((val / 100) * duration);
    }
  };

  return (
    <Slider
      min={0}
      max={100}
      value={isFinite(value) ? value : 0}
      onChange={handleChange}
      tooltip={{
        formatter: (val) =>
          typeof val === 'number' ? `${((val / 100) * duration).toFixed(1)}s` : '',
      }}
    />
  );
}
