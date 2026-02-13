import type { ColorPickerProps } from 'antd';
import { ColorPicker } from 'antd';

interface AppColorPickerProps extends ColorPickerProps {}

export const AppColorPicker = (props: AppColorPickerProps) => {
  return <ColorPicker format="hex" showText presets={DEFAULT_COLOR_PRESETS} {...props} />;
};
