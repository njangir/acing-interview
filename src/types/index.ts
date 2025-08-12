
import type { LucideIcon } from 'lucide-react';

export type ServiceSection = {
  type: 'text';
  content: string; 
} | {
  type: 'image';
  imageUrl: string;
  imageHint: string;
  title: string;
};

export interface Service {
  id: string;
  slug?: string;
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
  detailSections?: ServiceSection[];
  createdAt?: any;
  updatedAt?: any;
}

export type BlogPostSection = {
  type: 'text';
  content: string;
} | {
  type: 'image';
  imageUrl: string;
  imageHint?: string;
  title: string; // Title for image section for alt text and context
};


export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  author: string;
  publicationDate: any; // ISO string
  bannerImageUrl: string;
  bannerImageDataAiHint?: string;
  sections: BlogPostSection[];
  status: 'published' | 'draft';
  createdAt?: any;
  updatedAt?: any;
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
  createdAt?: any; 
  updatedAt?: any;
}

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
  uid: string; 
  userName: string; 
  userEmail: string; 
  subject: string;
  messageBody: string;
  timestamp: any; 
  status: 'new' | 'read' | 'replied' | 'closed'; 
  senderType: 'user' | 'admin'; 
  adminName?: string; 
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
  createdAt?: any; 
  updatedAt?: any; 
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  imageUrl?: string;
  roles?: ('user' | 'admin')[];
  awardedBadgeIds?: string[];
  awardedBadges?: Badge[]; 
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
  id: string; 
  submissionDate: any; 
  bookingId: string;
  userName: string;
  serviceName: string;
  reportFileName?: string;
  badgeAssignedName?: string;
  adminUid?: string;
  createdAt?: any;
}

export interface HeroSectionData {
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroImageUrl: string;
  heroDataAiHint?: string;
  updatedAt?: any;
}
