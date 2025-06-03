export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
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
}

export interface Booking {
  id:string;
  serviceName: string;
  date: string;
  time: string;
  meetingLink: string;
  status: 'upcoming' | 'completed' | 'cancelled';
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
