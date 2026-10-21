import React from 'react';

interface ThumbIconProps {
  size?: number | string;
  color?: string;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const ThumbUpIcon: React.FC<ThumbIconProps> = ({
  size = 16,
  color = '#7c1fb8',
  fill = 'currentColor',
  className = '',
  style = {},
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: '-2px',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3" />
    </svg>
  );
};

export const ThumbDownIcon: React.FC<ThumbIconProps> = ({
  size = 16,
  color = '#7c1fb8',
  fill = 'currentColor',
  className = '',
  style = {},
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: '-2px',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <path d="M17 14V2" />
      <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3" />
    </svg>
  );
};
