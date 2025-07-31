
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
      >
        AF Interview Ace
      </text>
    </svg>
  );
}
