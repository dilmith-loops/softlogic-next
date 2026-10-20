import React from 'react';

interface StethoscopeIconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StethoscopeIcon: React.FC<StethoscopeIconProps> = ({
  size = 20,
  color = '#ffffff',
  className = '',
  style = {},
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: '-3px',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <path d="M4.5 3h2v4a5.5 5.5 0 0 0 11 0V3h2" />
      <path d="M12 12.5V17a3 3 0 0 0 3 3h1a3 3 0 0 0 3-3v-4.5" />
      <circle cx="19" cy="9.5" r="2.5" fill={color} />
    </svg>
  );
};

export default StethoscopeIcon;
