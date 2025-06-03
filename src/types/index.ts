
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string; // e.g., "60 mins", "2 hours"
  features: string[];
  image?: string;
  dataAiHint?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  batch?: string;
  story: string;
  imageUrl?: string;
  dataAiHint?: string;
  serviceTaken: string;
  status: 'pending' | 'approved' | 'rejected'; 
}

export interface Booking {
  id:string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g., 10:00 AM
  userName: string; 
  userEmail: string; 
  meetingLink: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending_approval'; 
  paymentStatus: 'paid' | 'pay_later_pending' | 'pay_later_unpaid'; 
  reportUrl?: string;
  userFeedback?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  description?: string;
  serviceCategory: string; 
  icon?: React.ElementType;
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

export interface SlotCreationOptions {
  startDate: Date;
  endDate?: Date; 
  startTime: string; 
  endTime: string; 
  interval: number; 
  daysOfWeek: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
}

export interface UserMessage {
  id: string;
  userName: string;
  userEmail: string;
  subject: string;
  messageBody: string;
  timestamp: Date;
  status: 'new' | 'read' | 'replied';
}
