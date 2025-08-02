
import type { firestore } from 'firebase-admin';

// This file contains shared types between frontend and backend.

export interface Booking {
  id:string;
  uid: string;
  serviceName: string;
  serviceId: string;
  date: string;
  time: string;
  userName: string;
  userEmail: string;
  meetingLink: string;
  status: 'accepted' | 'scheduled' | 'completed' | 'cancelled' | 'pending_approval' | 'pending_payment';
  paymentStatus: 'paid' | 'pay_later_pending' | 'pay_later_unpaid';
  reportUrl?: string;
  userFeedback?: string;
  rating?: number;
  requestedRefund?: boolean;
  refundReason?: string;
  transactionId?: string | null;
  detailedFeedback?: { skill: string; rating: string; comments?: string }[];
  createdAt?: firestore.FieldValue;
  updatedAt?: firestore.FieldValue;
}

export interface UserMessage {
  id: string;
  uid: string;
  userName: string;
  userEmail: string;
  subject: string;
  messageBody: string;
  timestamp: firestore.FieldValue;
  status: 'new' | 'read' | 'replied' | 'closed';
  senderType: 'user' | 'admin';
  adminName?: string;
  createdAt?: firestore.FieldValue;
  updatedAt?: firestore.FieldValue;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  image?: string;
  dataAiHint?: string;
  defaultForce?: 'Air Force' | 'Army' | 'Navy' | 'General';
  isBookable?: boolean;
  hasDetailsPage?: boolean;
  howItWorks?: string;
  whatToExpect?: string;
  howItWillHelp?: string;
  createdAt?: firestore.FieldValue;
  updatedAt?: firestore.FieldValue;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  description?: string;
  serviceCategory: string;
  createdAt?: firestore.FieldValue;
  updatedAt?: firestore.FieldValue;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  force: 'Air Force' | 'Army' | 'Navy' | 'General';
  rankName: string;
  imageUrl: string;
  dataAiHint: string;
  createdAt?: firestore.FieldValue;
  updatedAt?: firestore.FieldValue;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  imageUrl?: string;
  roles?: ('user' | 'admin')[];
  awardedBadgeIds?: string[];
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  targetOrganization?: 'Army' | 'Navy' | 'Air Force' | 'Other';
  createdAt?: firestore.FieldValue;
  updatedAt?: firestore.FieldValue;
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
  updatedAt?: firestore.FieldValue;
}

export interface Testimonial {
  id: string;
  uid: string;
  name: string;
  userEmail?: string;
  batch?: string;
  story: string;
  imageUrl?: string;
  dataAiHint?: string;
  serviceTaken: string;
  serviceId?: string;
  submissionStatus?: 'aspirant' | 'selected_cleared';
  status: 'pending' | 'approved' | 'rejected';
  selectedForce?: 'Army' | 'Navy' | 'Air Force';
  interviewLocation?: string;
  numberOfAttempts?: number;
  bodyImageUrl?: string;
  bodyImageDataAiHint?: string;
  createdAt?: firestore.FieldValue;
  updatedAt?: firestore.FieldValue;
}

export interface FeedbackSubmissionHistoryEntry {
  id: string;
  submissionDate: firestore.FieldValue;
  bookingId: string;
  userName: string;
  serviceName: string;
  reportFileName?: string;
  badgeAssignedName?: string;
  adminUid?: string;
  createdAt?: firestore.FieldValue;
}

export interface HeroSectionData {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImageUrl: string;
  heroDataAiHint?: string;
  updatedAt?: firestore.FieldValue;
}
