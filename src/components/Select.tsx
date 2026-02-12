import React, { useCallback, useMemo } from 'react';
import { TriangleIcon } from '@/icons';
import { Select as AntdSelect, SelectProps as AntdSelectProps } from 'antd';

interface SelectProps<T = any> extends AntdSelectProps<T> {
  enableArrowChange?: boolean;
}

const Select = <T,>({
  value,
  onChange,
  options = [],
  enableArrowChange = true,
  className,
  ...rest
}: SelectProps<T>) => {
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const flatValues = useMemo(() => {
    return options.flatMap((opt: any) =>
      opt.options ? opt.options.map((o: any) => o.value) : [opt.value]
    );
  }, [options]);

  const valueToOption = useMemo(() => {
    const map = new Map<any, any>();
    options.forEach((opt: any) => {
      if (opt.options) {
        opt.options.forEach((o: any) => map.set(o.value, o));
      } else {
        map.set(opt.value, opt);
      }
    });
    return map;
  }, [options]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!enableArrowChange || flatValues.length === 0) return;

      const currentIndex = flatValues.findIndex((v) => v === value);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = currentIndex < flatValues.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : flatValues.length - 1;
      } else {
        return;
      }

      const nextValue = flatValues[nextIndex];
      if (nextValue !== value) {
        onChange?.(nextValue, valueToOption.get(nextValue));
      }
    },
    [enableArrowChange, flatValues, onChange, valueToOption]
  );

  return (
    <AntdSelect<T>
      {...rest}
      className={cn('input-theme', className)}
      value={value}
      options={options}
      popupMatchSelectWidth={false}
      suffixIcon={<TriangleIcon className="rotate-90 dark:text-white" />}
      onChange={onChange}
      onKeyDown={handleKeyDown}
    />
  );
};

export default Select;
