
import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 50"
      className="h-9 w-auto" // Adjust size as needed
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--saffron))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--india-green))', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="drop-shadow" x="-0.1" y="-0.1" width="1.2" height="1.2">
          <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodColor="rgba(0,0,0,0.3)" />
        </filter>
      </defs>
      <text
        x="50%"
        y="50%"
        dy=".35em"
        textAnchor="middle"
        fontFamily="Playfair Display, serif"
        fontSize="28"
        fontWeight="bold"
        fill="url(#logoGradient)"
        filter="url(#drop-shadow)"
      >
        AF Interview Ace
      </text>
    </svg>
  );
}
