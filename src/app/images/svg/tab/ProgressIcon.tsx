import React from 'react';
import { IconProps } from '@/src/app/types';

const ProgressIcon: React.FC<IconProps> = ({ color = '#6B7280', size = 24, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 25 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M12.8999 12.75C13.7283 12.75 14.3999 12.0784 14.3999 11.25C14.3999 10.4216 13.7283 9.75 12.8999 9.75C12.0715 9.75 11.3999 10.4216 11.3999 11.25C11.3999 12.0784 12.0715 12.75 12.8999 12.75Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.8999 6.75C13.7283 6.75 14.3999 6.07843 14.3999 5.25C14.3999 4.42157 13.7283 3.75 12.8999 3.75C12.0715 3.75 11.3999 4.42157 11.3999 5.25C11.3999 6.07843 12.0715 6.75 12.8999 6.75Z"
      stroke={color}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.8999 20.625C13.9354 20.625 14.7749 19.7855 14.7749 18.75C14.7749 17.7145 13.9354 16.875 12.8999 16.875C11.8644 16.875 11.0249 17.7145 11.0249 18.75C11.0249 19.7855 11.8644 20.625 12.8999 20.625Z"
      fill={color}
      stroke={color}
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.8999 6.75L12.8999 9.75"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path
      d="M12.8999 12.75L12.8999 16.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export default ProgressIcon;
