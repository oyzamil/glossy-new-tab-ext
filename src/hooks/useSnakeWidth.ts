import { useCallback, useState } from 'react';

export const useSnakeWidth = (tailLength: number, stepSize: number) => {
  const [snakeWidth, setSnakeWidth] = useState(tailLength * stepSize);

  const updateWidth = useCallback(
    (containerWidth: number) => {
      const slots = Math.floor(containerWidth / stepSize);
      const cometBlocks = Math.max(tailLength, Math.floor(slots * 0.3));
      setSnakeWidth(cometBlocks * stepSize);
    },
    [tailLength, stepSize]
  );

  useSharedResize(updateWidth);

  return snakeWidth;
};
