import React from 'react';

export function Globe({ className = "" }: { className?: string }) {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={`text-espresso ${className}`} aria-label="A line-drawn globe with a flight path between America and New Zealand">
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="1"/>
      <ellipse cx="60" cy="60" rx="25" ry="50" stroke="currentColor" strokeWidth="1"/>
      <ellipse cx="60" cy="60" rx="6" ry="50" stroke="currentColor" strokeWidth="1"/>
      <line x1="10" y1="60" x2="110" y2="60" stroke="currentColor" strokeWidth="1"/>
      <path d="M30 45 Q 60 20 85 75" stroke="var(--color-saddle)" strokeWidth="1.2" strokeDasharray="3 4" fill="none"/>
      <path d="M28 42 L30 46 L34 47 L31 50 L32 54 L28 52 L24 54 L25 50 L22 47 L26 46 Z" fill="currentColor"/>
      <path d="M85 75 L87 79 L91 80 L88 83 L89 87 L85 85 L81 87 L82 83 L79 80 L83 79 Z" fill="currentColor"/>
    </svg>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center w-[56px] mx-auto opacity-45 my-12 ${className}`} aria-hidden="true">
      <div className="flex-1 h-[1px] bg-taupe"></div>
      <div className="w-[5px] h-[5px] border border-taupe rotate-45 mx-2"></div>
      <div className="flex-1 h-[1px] bg-taupe"></div>
    </div>
  );
}

export function DogPortraitWinslow({ className = "" }: { className?: string }) {
  return (
    <svg width="100" height="130" viewBox="0 0 100 130" fill="none" className={`text-espresso ${className}`}>
      <ellipse cx="50" cy="65" rx="49" ry="64" stroke="var(--color-taupe)" strokeWidth="1"/>
      <path d="M30 45 Q 20 25 30 15 Q 38 30 42 35 M 70 45 Q 80 25 70 15 Q 62 30 58 35" stroke="currentColor" strokeWidth="1"/>
      <path d="M42 35 Q 50 30 58 35 Q 75 55 65 75 Q 50 90 35 75 Q 25 55 42 35" stroke="currentColor" strokeWidth="1"/>
      <path d="M42 65 Q 50 60 58 65 Q 62 75 50 80 Q 38 75 42 65" stroke="currentColor" strokeWidth="1"/>
      <circle cx="50" cy="66" r="3" fill="currentColor"/>
      <ellipse cx="38" cy="52" rx="2" ry="2" fill="currentColor"/>
      <ellipse cx="62" cy="52" rx="2" ry="2" fill="currentColor"/>
      <path d="M28 72 L 50 95 L 72 72 Z" stroke="var(--color-taupe)" strokeWidth="1" fill="none"/>
    </svg>
  );
}

export function DogPortraitBear({ className = "" }: { className?: string }) {
  return (
    <svg width="100" height="130" viewBox="0 0 100 130" fill="none" className={`text-espresso ${className}`}>
      <ellipse cx="50" cy="65" rx="49" ry="64" stroke="var(--color-taupe)" strokeWidth="1"/>
      <path d="M28 42 Q 15 22 25 12 Q 32 30 40 35 M 72 42 Q 85 22 75 12 Q 68 30 60 35" stroke="currentColor" strokeWidth="1"/>
      <path d="M40 35 Q 50 28 60 35 Q 76 52 68 72 Q 50 88 32 72 Q 24 52 40 35" stroke="currentColor" strokeWidth="1"/>
      <path d="M43 62 Q 50 58 57 62 Q 61 72 50 78 Q 39 72 43 62" stroke="currentColor" strokeWidth="1"/>
      <path d="M47 64 L 53 64 L 50 67 Z" fill="currentColor"/>
      <ellipse cx="37" cy="48" rx="2.5" ry="2" fill="currentColor"/>
      <ellipse cx="63" cy="48" rx="2.5" ry="2" fill="currentColor"/>
      <path d="M26 70 L 50 94 L 74 70 Z" stroke="var(--color-taupe)" strokeWidth="1" fill="none"/>
    </svg>
  );
}

export function Horseshoe({ className = "" }: { className?: string }) {
  return (
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none" className={`text-saddle ${className}`}>
      <path d="M15 10 L15 35 A 15 15 0 0 0 45 35 L45 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <path d="M10 10 L20 10 M40 10 L50 10" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="14" y="20" width="2" height="2" fill="currentColor"/>
      <rect x="14" y="28" width="2" height="2" fill="currentColor"/>
      <rect x="44" y="20" width="2" height="2" fill="currentColor"/>
      <rect x="44" y="28" width="2" height="2" fill="currentColor"/>
      <rect x="20" y="44" width="2" height="2" fill="currentColor" transform="rotate(-30 21 45)"/>
      <rect x="38" y="44" width="2" height="2" fill="currentColor" transform="rotate(30 39 45)"/>
    </svg>
  );
}

export function HumanPortraitPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-none border border-taupe/60 flex items-center justify-center ${className}`}>
      <div className="w-[20px] h-[1px] bg-taupe/40"></div>
    </div>
  );
}
