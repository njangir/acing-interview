
import type { Badge } from '@/types';
import { Shield, FileText, CalendarDays, Users, ListChecks, Edit3, UploadCloud, BookCopy, MessageSquare, UserCog, CalendarPlus, MailQuestion, MessagesSquare, Award, Edit2Icon, DownloadCloud, LayoutDashboard, Rss } from 'lucide-react';
import { getFutureDate } from '@/lib/utils';

export const PREDEFINED_AVATARS: {id: string, url: string, hint: string}[] = [
  { id: 'avatar1', url: '/avatars/av1.png', hint: 'abstract user icon blue' },
  { id: 'avatar2', url: '/avatars/av2.png', hint: 'abstract user icon orange' },
  { id: 'avatar3', url: '/avatars/av3.png', hint: 'abstract user icon green' },
  { id: 'avatar4', url: '/avatars/av4.png', hint: 'abstract user icon purple' },
  { id: 'avatar5', url: '/avatars/av5.png', hint: 'abstract user icon yellow' },
  { id: 'avatar6', url: '/avatars/av6.png', hint: 'abstract user icon red' },
];

export const DASHBOARD_NAV_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: Shield },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: CalendarDays },
  { href: '/dashboard/resources', label: 'My Resources', icon: FileText },
  { href: '/dashboard/profile', label: 'Profile & Badges', icon: Users },
  { href: '/dashboard/submit-testimonial', label: 'Submit Testimonial', icon: Edit2Icon },
  { href: '/dashboard/contact', label: 'Contact Support', icon: MailQuestion },
];

export const ADMIN_DASHBOARD_NAV_LINKS = [
  { href: '/admin', label: 'Admin Overview', icon: Shield },
  { href: '/admin/bookings', label: 'Booking Requests', icon: ListChecks },
  { href: '/admin/slots', label: 'Manage Slots', icon: CalendarPlus },
  { href: '/admin/services', label: 'Manage Services', icon: Edit3 },
  { href: '/admin/blog', label: 'Manage Blog', icon: Rss },
  { href: '/admin/hero-section', label: 'Manage Hero', icon: LayoutDashboard },
  { href: '/admin/reports', label: 'Upload Report & Feedback', icon: UploadCloud },
  { href: '/admin/resources', label: 'Manage Resources', icon: BookCopy },
  { href: '/admin/testimonials', label: 'Approve Testimonials', icon: MessageSquare },
  { href: '/admin/mentor-profile', label: 'Update Mentor Profile', icon: UserCog },
  { href: '/admin/messages', label: 'User Messages', icon: MessagesSquare },
  { href: '/admin/badges', label: 'Manage Badges', icon: Award },
  { href: '/admin/export-reports', label: 'Export Reports', icon: DownloadCloud },
];

// This is now only used in the admin slots management page for quick actions, not for user-facing slot selection.
export const AVAILABLE_SLOTS: Record<string, string[]> = {
  [getFutureDate(7)]: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
  [getFutureDate(8)]: ["10:00 AM", "01:00 PM", "03:00 PM"],
  [getFutureDate(9)]: ["09:30 AM", "11:30 AM", "02:30 PM"],
  [getFutureDate(14)]: ["10:00 AM", "12:00 PM", "03:00 PM"],
  [getFutureDate(15)]: ["09:00 AM", "11:00 AM"],
  [getFutureDate(20)]: ["10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"],
  [getFutureDate(21)]: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM"],
  [getFutureDate(60)]: ["10:00 AM", "11:00 AM", "12:00 PM"],
  [getFutureDate(61)]: ["02:00 PM", "03:00 PM", "04:00 PM"],
  [getFutureDate(3)]: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"],
  [getFutureDate(1)]: ["02:00 PM", "03:00 PM", "04:00 PM"],
};


// The MOCK_BADGES constant is still used by the onUserCreate Firebase Function.
// PRODUCTION REFACTOR: This function should fetch the badge ID from a 'configs' collection in Firestore
// instead of relying on this hardcoded constant.
export const MOCK_BADGES: Badge[] = [
  {
    id: 'af_pilot_aspirant',
    name: 'Pilot Aspirant Badge',
    description: 'Awarded for showing strong aptitude towards aviation concepts during AFCAT guidance.',
    force: 'Air Force',
    rankName: 'Pilot Aspirant',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'air force pilot insignia',
  },
  {
    id: 'army_leadership_potential',
    name: 'Leadership Potential Badge',
    description: 'Recognized for demonstrating key leadership qualities in SSB mock interview.',
    force: 'Army',
    rankName: 'Officer Candidate',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'army officer badge',
  },
  {
    id: 'commendable_effort',
    name: 'Commendable Effort Badge',
    description: 'Awarded for outstanding effort and dedication during preparation.',
    force: 'General',
    rankName: 'Dedicated Learner',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'star award',
  }
];

export const PREDEFINED_SKILLS: string[] = [
    "Clarity of Thought and Expression",
    "Self-Awareness",
    "Leadership Potential",
    "Social Adaptability",
    "Effective Intelligence",
    "Reasoning Ability",
    "Determination and Willpower",
    "Emotional Stability",
    "Responsibility and Maturity",
];

export const KEY_SKILLS_FOR_CHART: string[] = [
    "Leadership Potential",
    "Effective Intelligence",
    "Reasoning Ability",
    "Social Adaptability",
    "Clarity of Thought and Expression",
];


export const SKILL_RATINGS: string[] = [
    "Needs Significant Improvement",
    "Needs Improvement",
    "Satisfactory",
    "Good",
    "Very Good",
    "Excellent",
    "Outstanding",
];

export const SKILL_RATING_VALUES: Record<string, number> = {
  "Needs Significant Improvement": 1,
  "Needs Improvement": 2,
  "Satisfactory": 3,
  "Good": 4,
  "Very Good": 5,
  "Excellent": 6,
  "Outstanding": 7,
};

export const MAX_SKILL_RATING_VALUE = 7;
export const TARGET_SKILL_RATING_VALUE = 4;
