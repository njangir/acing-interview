
import type { SVGProps } from 'react';

export function IndianFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 900 600"
      className="h-6 w-auto rounded-sm"
      {...props}
    >
      <rect width="900" height="600" fill="#FFFFFF" />
      <rect width="900" height="200" fill="hsl(var(--saffron))" />
      <rect y="400" width="900" height="200" fill="hsl(var(--india-green))" />
      <circle cx="450" cy="300" r="80" fill="#FFFFFF" />
      <circle cx="450" cy="300" r="70" fill="hsl(var(--primary))" />
      <circle cx="450" cy="300" r="30" fill="#FFFFFF" />
      <g>
        {[...Array(24)].map((_, i) => (
          <line
            key={i}
            x1="450"
            y1="300"
            x2="450"
            y2="230"
            stroke="hsl(var(--primary))"
            strokeWidth="15"
            transform={`rotate(${i * 15}, 450, 300)`}
          />
        ))}
      </g>
    </svg>
  );
}
