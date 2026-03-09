import React from 'react';
import { IconProps } from '@/src/app/types';

const TokenIcon: React.FC<IconProps> = ({ color = '#6B7280', size = 16, style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={style}
  >
    <path
      d="M9.74976 21C12.6493 21 14.9998 16.9706 14.9998 12C14.9998 7.02944 12.6493 3 9.74976 3C6.85026 3 4.49976 7.02944 4.49976 12C4.49976 16.9706 6.85026 21 9.74976 21Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.74976 3H14.2498C17.1494 3 19.4998 7.03125 19.4998 12C19.4998 16.9688 17.1494 21 14.2498 21H9.74976"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.6628 6H18.1628"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.9998 12H19.4998"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.6628 18H18.1628"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.99976 11.25C9.19867 11.25 9.38943 11.329 9.53009 11.4697C9.67074 11.6103 9.74976 11.8011 9.74976 12V15.75C9.74976 15.9489 9.82877 16.1397 9.96943 16.2803C10.1101 16.421 10.3008 16.5 10.4998 16.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9.37476 9C9.99608 9 10.4998 8.49632 10.4998 7.875C10.4998 7.25368 9.99608 6.75 9.37476 6.75C8.75344 6.75 8.24976 7.25368 8.24976 7.875C8.24976 8.49632 8.75344 9 9.37476 9Z"
      fill={color}
    />
  </svg>
);

export default TokenIcon;
