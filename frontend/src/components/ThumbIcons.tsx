import React from 'react';

interface ThumbIconProps {
  size?: number | string;
  color?: string;
  fill?: string;
  filled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const UP_FILLED_PATH =
  'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z';

const UP_OUTLINE_PATH =
  'M18.77 11h-4.23l1.52-4.94C16.38 5.03 15.54 4 14.38 4c-.58 0-1.14.24-1.52.65L7 11H3v10h4h1h11c1.24 0 2.31-.84 2.57-2.05l1.41-6.59c.28-1.28-.5-2.01-1.21-2.01zM7 20H4v-8h3v8zm14.98-7.82l-1.41 6.59c-.14.67-.79 1.23-1.57 1.23H8V11.41l5.59-5.99c.25-.26.52-.42.79-.42.39 0 .73.3.85.68l-1.74 5.64-.67 2.68H15h3.77c.47 0 .89.24 1.06.61.16.36.17.76-.02 1.17z';

export const ThumbUpIcon: React.FC<ThumbIconProps> = ({
  size = 16,
  color = '#7c1fb8',
  fill,
  filled,
  className = '',
  style = {},
}) => {
  const isFilled =
    filled !== undefined
      ? Boolean(filled)
      : fill !== undefined
      ? fill !== 'none' && fill !== 'transparent' && fill !== ''
      : false;
  const iconColor = color || (fill && fill !== 'none' ? fill : '#7c1fb8');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={iconColor}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: '-2px',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <path d={isFilled ? UP_FILLED_PATH : UP_OUTLINE_PATH} />
    </svg>
  );
};

export const ThumbDownIcon: React.FC<ThumbIconProps> = ({
  size = 16,
  color = '#7c1fb8',
  fill,
  filled,
  className = '',
  style = {},
}) => {
  const isFilled =
    filled !== undefined
      ? Boolean(filled)
      : fill !== undefined
      ? fill !== 'none' && fill !== 'transparent' && fill !== ''
      : false;
  const iconColor = color || (fill && fill !== 'none' ? fill : '#7c1fb8');

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={iconColor}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: '-2px',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      <path
        d={isFilled ? UP_FILLED_PATH : UP_OUTLINE_PATH}
        transform="rotate(180 12 12)"
      />
    </svg>
  );
};
