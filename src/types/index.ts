
import type { LucideIcon } from 'lucide-react';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string; // e.g., "60 mins", "2 hours"
  features: string[];
  image?: string;
  dataAiHint?: string;
  defaultForce?: 'Air Force' | 'Army' | 'Navy' | 'General';
  isBookable?: boolean; // New field
  createdAt?: any; // Should be Firestore Timestamp
  updatedAt?: any; // Should be Firestore Timestamp
}

export interface Testimonial {
  id: string;
  uid: string; // Link to user's auth UID
  name: string;
  userEmail?: string;
  batch?: string; // Existing field
  story: string;
  imageUrl?: string; // This will now primarily be a fallback for the avatar
  dataAiHint?: string; // For the avatar image
  serviceTaken: string;
  serviceId?: string;
  submissionStatus?: 'aspirant' | 'selected_cleared';
  status: 'pending' | 'approved' | 'rejected';
  selectedForce?: 'Army' | 'Navy' | 'Air Force';
  interviewLocation?: string;
  numberOfAttempts?: number;
  bodyImageUrl?: string; // New field for image within the testimonial body
  bodyImageDataAiHint?: string; // New field for AI hint for body image
  createdAt?: any; // ISO string for dates
  updatedAt?: any; // ISO string for dates
}

export interface Booking {
  id:string;
  uid: string; // Link to user's auth UID
  serviceName: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., 10:00 AM
  userName: string;
  userEmail: string;
  meetingLink: string;
  status: 'accepted' | 'scheduled' | 'completed' | 'cancelled' | 'pending_approval' | 'pending_payment';
  paymentStatus: 'paid' | 'pay_later_pending' | 'pay_later_unpaid';
  reportUrl?: string;
  userFeedback?: string;
  requestedRefund?: boolean;
  refundReason?: string;
  transactionId?: string | null;
  detailedFeedback?: { skill: string; rating: string; comments?: string }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  description?: string;
  serviceCategory: string;
  icon?: LucideIcon;
  createdAt?: any;
  updatedAt?: any;
}

export interface MentorProfileData {
  name: string;
  title: string;
  imageUrl: string;
  dataAiHint: string;
  bio: string;
  experience: string[];
  philosophy: string;
  quote: string;
  contactEmail: string;
  contactPhone: string;
  updatedAt?: any;
}

export interface UserMessage {
  id: string;
  uid: string; // Link to user's auth UID
  userName: string; // Name of the user who initiated or is part of the conversation
  userEmail: string; // Email of the user, used as a conversation key
  subject: string;
  messageBody: string;
  timestamp: any; // Keep as Date object for sorting
  status: 'new' | 'read' | 'replied' | 'closed'; // Status can apply to individual message or conversation
  senderType: 'user' | 'admin'; // Who sent THIS specific message
  adminName?: string; // Name of admin if senderType is 'admin'
  createdAt?: any;
  updatedAt?: any;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  force: 'Air Force' | 'Army' | 'Navy' | 'General';
  rankName: string;
  imageUrl: string;
  dataAiHint: string;
  createdAt?: any; // Added for production readiness
  updatedAt?: any; // Added for production readiness
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  imageUrl?: string;
  roles?: ('user' | 'admin')[];
  awardedBadgeIds?: string[];
  awardedBadges?: Badge[]; // For frontend display, may be populated after fetching details from awardedBadgeIds
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  targetOrganization?: 'Army' | 'Navy' | 'Air Force' | 'Other';
  createdAt?: any;
  updatedAt?: any;
}

export interface UserNotification {
  id: string;
  userId: string;
  message: string;
  href: string;
  seen: boolean;
  timestamp: any;
  type: 'booking_update' | 'message_reply' | 'general';
}


export interface FeedbackSubmissionHistoryEntry {
  id: string; // Unique ID for the history entry
  submissionDate: any; // ISO date string
  bookingId: string;
  userName: string;
  serviceName: string;
  reportFileName?: string;
  badgeAssignedName?: string;
  adminUid?: string;
  createdAt?: any;
}
