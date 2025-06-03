
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
