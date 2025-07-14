import React from "react";

interface CheckIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const CheckIcon: React.FC<CheckIconProps> = ({ className = "", size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="check-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E3F584" />
        <stop offset="1" stopColor="#b6e35c" />
      </linearGradient>
    </defs>
    <circle cx="12" cy="12" r="12" fill="url(#check-gradient)" fillOpacity="0.2" />
    <path
      d="M7 12.5L11 16L17 9.5"
      stroke="url(#check-gradient)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CheckIcon; 