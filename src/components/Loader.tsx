import React, { CSSProperties, useMemo } from 'react';
import { config } from '@/app.config';
import Color from 'color';

interface LoaderProps {
  className?: string;
  color?: string;
  speed?: number;
  showTrack?: boolean;
  shape?: 'cube' | 'circle';
  tailLength?: number;
  blockSize?: number;
  gapSize?: number;
  content?: string | React.ReactNode;
}

export const Loader: React.FC<LoaderProps> = ({
  className,
  color = config.APP.color,
  speed = 1,
  showTrack = true,
  shape = 'cube',
  tailLength = 10,
  blockSize = 15,
  gapSize = 5,
  content = '',
}) => {
  const stepSize = blockSize + gapSize;
  const snakeWidth = useSnakeWidth(tailLength, stepSize);

  const hexToRgba = (hex: string, alpha: number) => Color(hex).alpha(alpha).rgb().string();

  const gradRight = useMemo(
    () =>
      `linear-gradient(to right, transparent 0%, ${hexToRgba(
        color,
        0.05
      )} 10%, ${hexToRgba(color, 0.3)} 40%, ${hexToRgba(color, 0.6)} 70%, ${color} 100%)`,
    [color]
  );

  const gradLeft = useMemo(
    () =>
      `linear-gradient(to left, transparent 0%, ${hexToRgba(
        color,
        0.05
      )} 10%, ${hexToRgba(color, 0.3)} 40%, ${hexToRgba(color, 0.6)} 70%, ${color} 100%)`,
    [color]
  );

  const maskPattern =
    shape === 'circle'
      ? `radial-gradient(circle, #000 ${blockSize / 2}px, transparent ${blockSize / 2 + 0.5}px)`
      : `linear-gradient(90deg, #000 ${blockSize}px, transparent 0)`;

  const trackPattern =
    shape === 'circle'
      ? `radial-gradient(circle, ${hexToRgba(color, 0.08)} ${blockSize / 2}px, transparent ${
          blockSize / 2 + 0.5
        }px)`
      : `linear-gradient(90deg, ${hexToRgba(color, 0.08)} ${blockSize}px, transparent 0)`;

  const blockSizeStr =
    shape === 'circle' ? `${blockSize}px ${blockSize}px` : `${stepSize}px ${blockSize}px`;

  const style: CSSProperties = {
    '--grad-right': gradRight,
    '--grad-left': gradLeft,
    '--snakeWidth': `${snakeWidth}px`,
    '--loader-height': `${blockSize}px`,
    '--mask-pattern': maskPattern,
    '--track-pattern': trackPattern,
    '--block-size': blockSizeStr,
    '--loader-speed': `${speed}s`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        `gray border-theme flex-col-center bg-theme w-full items-center justify-center gap-2 rounded-md border p-3 pb-2`,
        className
      )}
    >
      <div className="relative flex w-full overflow-hidden">
        {showTrack && <div className="loader-track" style={style} />}
        <span className="snake-comet-loader" style={style} />
      </div>
      {content && <p className="">{content}</p>}
    </div>
  );
};

export default Loader;
