import React from "react";

interface CheckIconProps {
  className?: string;
  size?: number;
  color?: string;
}

const CheckIcon: React.FC<CheckIconProps> = ({ className = "", size = 24, color = "#22c55e" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="12" cy="12" r="12" fill={color + "20"} />
    <path
      d="M7 12.5L11 16L17 9.5"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CheckIcon; 