import React from 'react';

interface PinkRibbonIconProps {
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const PinkRibbonIcon: React.FC<PinkRibbonIconProps> = ({
  size = 18,
  color = '#ff2d88',
  className = '',
  style = {},
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: '-3px',
        flexShrink: 0,
        filter: 'drop-shadow(0 0 4px rgba(255, 45, 136, 0.4))',
        ...style,
      }}
      aria-hidden="true"
    >
      <path d="M12 2C9.2 2 7 4.2 7 7c0 2.5 1.7 4.9 3.3 7.2L5.8 21.2a1 1 0 0 0 1.4 1.4L12 17.8l4.8 4.8a1 1 0 0 0 1.4-1.4l-4.5-7C15.3 11.9 17 9.5 17 7c0-2.8-2.2-5-5-5zm0 3c1.7 0 3 1.3 3 3 0 1.5-1.2 3.3-2.3 5-1.1-1.7-2.3-3.5-2.3-5 0-1.7 1.3-3 3-3z" />
    </svg>
  );
};

export default PinkRibbonIcon;
