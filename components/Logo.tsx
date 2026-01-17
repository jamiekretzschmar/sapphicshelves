
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo Component: The "Gilded Monograph"
 * A procedurally generated, vector-based logo that simulates gold foil stamping
 * on a book spine. It replaces the static PNG with a resolution-independent,
 * high-fidelity SVG.
 */
const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div 
      className={`relative select-none ${className}`}
      style={{ width: size, height: size }}
      aria-label="Sapphic Shelves Logo"
    >
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          {/* Gold Foil Gradient */}
          <linearGradient id="gold-foil" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bf953f" />
            <stop offset="20%" stopColor="#fcf6ba" />
            <stop offset="40%" stopColor="#b38728" />
            <stop offset="60%" stopColor="#fbf5b7" />
            <stop offset="80%" stopColor="#aa771c" />
            <stop offset="100%" stopColor="#bf953f" />
          </linearGradient>

          {/* Texture Filter for 'Foil' Effect */}
          <filter id="foil-texture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="desaturatedNoise" />
            <feComposite operator="in" in="desaturatedNoise" in2="SourceGraphic" result="maskedNoise" />
            <feBlend mode="multiply" in="maskedNoise" in2="SourceGraphic" />
          </filter>
          
          {/* Inner Shadow for Debossed Look */}
          <filter id="deboss">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="1" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="1" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Background Circle (Deep Leather/Ink) */}
        <circle cx="50" cy="50" r="48" fill="#1a2e40" stroke="url(#gold-foil)" strokeWidth="1.5" />

        {/* The Monogram: A stylized 'S' formed by two book pages/quills */}
        <g filter="url(#deboss)">
          {/* Left Page / Top Curve of S */}
          <path 
            d="M55 25 C 35 25, 25 40, 35 55 C 40 62, 55 58, 60 50 C 65 42, 50 35, 45 35" 
            stroke="url(#gold-foil)" 
            strokeWidth="5" 
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Page / Bottom Curve of S */}
          <path 
            d="M45 75 C 65 75, 75 60, 65 45 C 60 38, 45 42, 40 50 C 35 58, 50 65, 55 65" 
            stroke="url(#gold-foil)" 
            strokeWidth="5" 
            strokeLinecap="round"
            fill="none"
          />
          
          {/* Central Binding/Quill Spine */}
          <path
             d="M35 55 L 65 45"
             stroke="url(#gold-foil)"
             strokeWidth="3"
             strokeLinecap="round"
             opacity="0.8"
          />
        </g>

        {/* Subtle Shine Overlay */}
        <circle cx="50" cy="50" r="48" fill="url(#gold-foil)" opacity="0.05" style={{ mixBlendMode: 'overlay' }} />
      </svg>
    </div>
  );
};

export default Logo;
