
import type { SVGProps } from 'react';

export function IndianAirForceRoundelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className="h-8 w-8" // Adjusted size for roundel
      {...props}
    >
      <circle cx="50" cy="50" r="50" fill="hsl(var(--saffron))" />
      <circle cx="50" cy="50" r="33" fill="hsl(var(--background))" />
      <circle cx="50" cy="50" r="16" fill="hsl(var(--india-green))" />
    </svg>
  );
}
