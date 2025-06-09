
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a future date string in YYYY-MM-DD format.
 * @param daysToAdd Number of days to add to the current date.
 * @returns A string representing the future date.
 */
export function getFutureDate(daysToAdd: number): string {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysToAdd);
  return futureDate.toISOString().split('T')[0];
};
