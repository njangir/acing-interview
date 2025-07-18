import type { Service, Testimonial, Booking, Resource, MentorProfileData, UserMessage, Badge, UserProfile, FeedbackSubmissionHistoryEntry } from '@/types';
import { Shield, Video, FileText, Link as LinkIcon, CalendarDays, Users, UserSquare2, ListChecks, Edit3, UploadCloud, BookCopy, MessageSquare, UserCog, CalendarPlus, MailQuestion, MessagesSquare, Award, Edit2Icon, DownloadCloud, Sparkles } from 'lucide-react';
import { getFutureDate } from '@/lib/utils';

export const MOCK_BADGES: Badge[] = [
  {
    id: 'commendable_effort',
    name: 'Commendable Effort',
    description: 'Awarded for taking the first step towards your dream.',
    force: 'General',
    rankName: 'Aspirant',
    imageUrl: '/badges/commendable_effort.png', // Update path as needed
    dataAiHint: 'commendable effort badge',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Add more mock badges as needed
];

// Predefined avatars for user selection
export const PREDEFINED_AVATARS: {id: string, url: string, hint: string}[] = [
  { id: 'avatar1', url: 'https://placehold.co/100x100/EBF4FF/76A9FA?text=U1', hint: 'abstract user icon blue' },
  { id: 'avatar2', url: 'https://placehold.co/100x100/FFF0EB/FA9F76?text=U2', hint: 'abstract user icon orange' },
  { id: 'avatar3', url: 'https://placehold.co/100x100/EBFFF2/76FA91?text=U3', hint: 'abstract user icon green' },
  { id: 'avatar4', url: 'https://placehold.co/100x100/F9EBFF/C576FA?text=U4', hint: 'abstract user icon purple' },
  { id: 'avatar5', url: 'https://placehold.co/100x100/FFFDEB/F5E66B?text=U5', hint: 'abstract user icon yellow' },
  { id: 'avatar6', url: 'https://placehold.co/100x100/FFEBEE/FA7689?text=U6', hint: 'abstract user icon red' },
];

// Navigation links for user dashboard
export const DASHBOARD_NAV_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: Shield },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: CalendarDays },
  { href: '/dashboard/resources', label: 'My Resources', icon: FileText },
  { href: '/dashboard/profile', label: 'Profile & Badges', icon: Users },
  { href: '/dashboard/submit-testimonial', label: 'Submit Testimonial', icon: Edit2Icon },
  { href: '/dashboard/contact', label: 'Contact Support', icon: MailQuestion },
];

// Navigation links for admin dashboard
export const ADMIN_DASHBOARD_NAV_LINKS = [
  { href: '/admin', label: 'Admin Overview', icon: Shield },
  { href: '/admin/bookings', label: 'Booking Requests', icon: ListChecks },
  { href: '/admin/slots', label: 'Manage Slots', icon: CalendarPlus },
  { href: '/admin/services', label: 'Manage Services', icon: Edit3 },
  { href: '/admin/reports', label: 'Upload Report & Feedback', icon: UploadCloud },
  { href: '/admin/resources', label: 'Manage Resources', icon: BookCopy },
  { href: '/admin/testimonials', label: 'Approve Testimonials', icon: MessageSquare },
  { href: '/admin/mentor-profile', label: 'Update Mentor Profile', icon: UserCog },
  { href: '/admin/messages', label: 'User Messages', icon: MessagesSquare },
  { href: '/admin/badges', label: 'Manage Badges', icon: Award },
  { href: '/admin/export-reports', label: 'Export Reports', icon: DownloadCloud },
];

// Skill definitions for feedback forms
export const PREDEFINED_SKILLS: string[] = [
  "Communication Skills",
  "Officer-Like Qualities (OLQs)",
  "General Awareness",
  "Confidence Level",
  "Problem Solving Ability",
  "Group Interaction",
  "Technical Knowledge (if applicable)",
  "AFCAT Exam Knowledge",
  "Time Management Strategy",
];

// Rating system for skills
export const SKILL_RATINGS: string[] = [
  "Needs Significant Improvement", // 1
  "Needs Improvement",             // 2
  "Satisfactory",                  // 3
  "Good",                          // 4
  "Very Good",                     // 5
  "Excellent",                     // 6
  "Outstanding",                   // 7
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
export const TARGET_SKILL_RATING_VALUE = 4; // Represents "Good"

// Firestore collection names
export const FIRESTORE_COLLECTIONS = {
  USERS: 'userProfiles',
  SERVICES: 'services',
  BOOKINGS: 'bookings',
  TESTIMONIALS: 'testimonials',
  RESOURCES: 'resources',
  MESSAGES: 'userMessages',
  NOTIFICATIONS: 'userNotifications',
  BADGES: 'badges',
  MENTOR_PROFILE: 'mentorProfile',
  AVAILABLE_SLOTS: 'availableSlots',
  FEEDBACK_SUBMISSIONS: 'feedbackSubmissions',
} as const;

// Booking status types
export const BOOKING_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  ACCEPTED: 'accepted',
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUND_REQUESTED: 'refund_requested',
} as const;

// Payment status types
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PAY_LATER_PENDING: 'pay_later_pending',
  PAY_LATER_UNPAID: 'pay_later_unpaid',
  REFUNDED: 'refunded',
} as const;

// Testimonial status types
export const TESTIMONIAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Message status types
export const MESSAGE_STATUS = {
  NEW: 'new',
  REPLIED: 'replied',
  CLOSED: 'closed',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_UPDATED: 'booking_updated',
  BOOKING_STATUS_CHANGED: 'booking_status_changed',
  REFUND_REQUESTED: 'refund_requested',
  NEW_MESSAGE: 'new_message',
} as const;

// Service categories
export const SERVICE_CATEGORIES = {
  SSB_MOCK_INTERVIEW: 'ssb-mock-interview',
  PERSONAL_COUNSELLING: 'personal-counselling-session',
  AFCAT_GUIDANCE: 'afcat-exam-guidance',
  GENERAL: 'general',
} as const;

// Forces
export const FORCES = {
  ARMY: 'Army',
  NAVY: 'Navy',
  AIR_FORCE: 'Air Force',
  GENERAL: 'General',
} as const;

// Resource types
export const RESOURCE_TYPES = {
  DOCUMENT: 'document',
  VIDEO: 'video',
  LINK: 'link',
} as const;

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// Badge categories
export const BADGE_CATEGORIES = {
  PILOT_ASPIRANT: 'af_pilot_aspirant',
  LEADERSHIP_POTENTIAL: 'army_leadership_potential',
  STRATEGIC_THINKER: 'navy_strategic_thinker',
  SSB_SCREENED_IN: 'ssb_screened_in',
  COMMENDABLE_EFFORT: 'commendable_effort',
} as const;

// Submission status for testimonials
export const SUBMISSION_STATUS = {
  ASPIRANT: 'aspirant',
  SELECTED_CLEARED: 'selected_cleared',
} as const;

// Sender types for messages
export const SENDER_TYPES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

// Firebase Storage paths
export const STORAGE_PATHS = {
  AVATARS: 'avatars',
  RESOURCES: 'resources',
  REPORTS: 'reports',
  MENTOR_IMAGES: 'mentor-images',
  TESTIMONIAL_IMAGES: 'testimonial-images',
  BADGES: 'badges',
} as const;

// Default values
export const DEFAULT_VALUES = {
  PAGINATION_LIMIT: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  BOOKING_CANCELLATION_HOURS: 24,
  AUTO_CANCEL_UNPAID_HOURS: 24,
  MAX_EXPORT_RECORDS: 1000,
} as const;

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  CURRENCY: 'INR',
  PAYMENT_CAPTURE: 1,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  ADMIN_REQUIRED: 'Admin access required',
  INVALID_INPUT: 'Invalid input data',
  BOOKING_NOT_FOUND: 'Booking not found',
  PAYMENT_VERIFICATION_FAILED: 'Payment verification failed',
  SERVICE_NOT_FOUND: 'Service not found',
  USER_NOT_FOUND: 'User not found',
  GENERIC_ERROR: 'An unexpected error occurred',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  BOOKING_CONFIRMED: 'Booking confirmed successfully',
  PAYMENT_ORDER_CREATED: 'Payment order created successfully',
  STATUS_UPDATED: 'Status updated successfully',
  REFUND_PROCESSED: 'Refund request processed successfully',
  REPORT_EXPORTED: 'Report exported successfully',
} as const;

// Time configurations
export const TIME_CONFIG = {
  BOOKING_SLOT_DURATION: 60, // minutes
  BUFFER_TIME: 15, // minutes between slots
  MAX_ADVANCE_BOOKING_DAYS: 90,
  MIN_ADVANCE_BOOKING_HOURS: 24,
} as const;

// Validation rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_FEEDBACK_COMMENT_LENGTH: 500,
  MAX_TESTIMONIAL_LENGTH: 1000,
  PHONE_NUMBER_REGEX: /^[6-9]\d{9}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
} as const;

// Email templates (if using email service)
export const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_CANCELLED: 'booking_cancelled',
  PAYMENT_REMINDER: 'payment_reminder',
  REFUND_PROCESSED: 'refund_processed',
} as const;

// File upload configurations
export const FILE_UPLOAD_CONFIG = {
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

// API endpoints (if using external APIs)
export const API_ENDPOINTS = {
  RAZORPAY_ORDERS: 'https://api.razorpay.com/v1/orders',
  RAZORPAY_PAYMENTS: 'https://api.razorpay.com/v1/payments',
} as const;

// Cache configurations
export const CACHE_CONFIG = {
  SERVICES_TTL: 3600, // 1 hour
  TESTIMONIALS_TTL: 1800, // 30 minutes
  MENTOR_PROFILE_TTL: 7200, // 2 hours
} as const;

// Development/testing constants (remove or modify for production)
export const DEV_CONFIG = {
  ADMIN_EMAIL: 'admin@example.com',
  TEST_USER_EMAIL: 'aspirant@example.com',
  MOCK_PAYMENT_ID: 'pay_test_123',
  MOCK_ORDER_ID: 'order_test_123',
} as const;