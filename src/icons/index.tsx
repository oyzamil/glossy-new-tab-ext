export { default as ArrowIcon } from './Arrow.tsx';
export { default as BarsIcon } from './Bars.tsx';
export { default as ChatIcon } from './Chat.tsx';
export { default as KeyIcon } from './Key.tsx';
export { default as SettingsIcon } from './Settings.tsx';
export { default as StarIcon } from './Star.tsx';
export { default as TriangleIcon } from './Triangle.tsx';

export type IconType = React.SVGProps<SVGSVGElement> & {
  stroke?: string | number;
};
