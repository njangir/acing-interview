
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FileText, Video, Link as LinkIcon, LucideIcon } from 'lucide-react';
import type { Resource } from "@/types";

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

/**
 * Returns the appropriate Lucide icon component for a given resource type.
 * @param type The type of the resource.
 * @returns A LucideIcon component.
 */
export function getIconForResourceType(type: Resource['type']): LucideIcon {
    if (type === 'document') return FileText;
    if (type === 'video') return Video;
    return LinkIcon;
};
