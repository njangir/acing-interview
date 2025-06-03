
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
  status: 'pending' | 'approved' | 'rejected'; // New field
}

export interface Booking {
  id:string;
  serviceName: string;
  date: string;
  time: string;
  userName: string; // Added for admin panel
  userEmail: string; // Added for admin panel
  meetingLink: string;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending_approval'; // Added 'pending_approval'
  paymentStatus: 'paid' | 'pay_later_pending' | 'pay_later_unpaid'; // Added for pay later logic
  reportUrl?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'document' | 'link';
  url: string;
  description?: string;
  serviceCategory: string; // To link resource to a service
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
  contactEmail: string; // Added
  contactPhone: string; // Added
}

// For Admin Slot Management Page
export interface SlotCreationOptions {
  startDate: Date;
  endDate?: Date; // For ranges
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "17:00"
  interval: number; // in minutes, e.g., 60
  daysOfWeek: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
}
