
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
}

export interface Testimonial {
  id: string;
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
}

export interface Booking {
  id:string;
  serviceName: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., 10:00 AM
  userName: string;
  userEmail: string;
  meetingLink: string;
  status: 'accepted' | 'scheduled' | 'completed' | 'cancelled' | 'pending_approval';
  paymentStatus: 'paid' | 'pay_later_pending' | 'pay_later_unpaid';
  reportUrl?: string;
  userFeedback?: string;
  requestedRefund?: boolean;
  refundReason?: string;
  transactionId?: string | null;
  detailedFeedback?: { skill: string; rating: string; comments?: string }[];
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  description?: string;
  serviceCategory: string;
  icon?: LucideIcon;
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
}

export interface UserMessage {
  id: string;
  userName: string; // Name of the user who initiated or is part of the conversation
  userEmail: string; // Email of the user, used as a conversation key
  subject: string;
  messageBody: string;
  timestamp: string; // Changed from Date to string
  status: 'new' | 'read' | 'replied' | 'closed'; // Status can apply to individual message or conversation
  senderType: 'user' | 'admin'; // Who sent THIS specific message
  adminName?: string; // Name of admin if senderType is 'admin'
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  force: 'Air Force' | 'Army' | 'Navy' | 'General';
  rankName: string;
  imageUrl: string;
  dataAiHint: string;
  createdAt?: string; // Added for production readiness
  updatedAt?: string; // Added for production readiness
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  imageUrl?: string; // This is the user's chosen avatar
  awardedBadges: Badge[];
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  targetOrganization?: 'Army' | 'Navy' | 'Air Force' | 'Other';
}

export interface FeedbackSubmissionHistoryEntry {
  id: string; // Unique ID for the history entry
  submissionDate: string; // ISO date string
  bookingId: string;
  userName: string;
  serviceName: string;
  reportFileName?: string;
  badgeAssignedName?: string;
  // Optionally, a summary of skill ratings or comments
}
