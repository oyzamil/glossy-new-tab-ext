import { IconType } from '.';

export default ({ className, stroke = '2', ...props }: IconType) => {
  return (
    <svg
      className={cn('size-4 rotate-90', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={stroke}
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
};
