
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
    </svg>
  );
}
