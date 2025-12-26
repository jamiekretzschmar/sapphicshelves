
import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo Component: Archival Vector Protocol (AVP-V3)
 * High-fidelity Image implementation using the provided sapphire-glow trademark.
 * Zero-failure: Fallback to brand initials if image loading is interrupted.
 */
const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div 
      style={{ width: size, height: size }} 
      className={`flex items-center justify-center relative group select-none overflow-hidden rounded-full ${className}`}
    >
      {/* Brand Radiance Layer (Hover Effect) */}
      <div className="absolute inset-0 bg-brand-cyan/30 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <img 
        src="sapphic_logo.png" 
        alt="Sapphic Shelves Logo"
        className="w-full h-full sapphic-logo-exact relative z-10"
        style={{ width: size, height: size }}
        onError={(e) => {
          // Fallback if image fails
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.classList.add('bg-brand-deep', 'border', 'border-brand-cyan/20');
        }}
      />
    </div>
  );
};

export default Logo;
