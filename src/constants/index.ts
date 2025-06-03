import type { Service, Testimonial, Booking, Resource } from '@/types';
import { Shield, Video, FileText, Link as LinkIcon, CalendarDays, CheckCircle, Users } from 'lucide-react';

export const MOCK_SERVICES: Service[] = [
  {
    id: 'ssb-mock-interview',
    name: 'SSB Mock Interview',
    description: 'Comprehensive mock interview simulating the actual SSB experience with personalized feedback.',
    price: 2999,
    features: ['One-on-One Interview', 'Psychological Test Analysis (TAT, WAT, SRT)', 'GTO Task Briefing', 'Personalized Feedback Report', 'Doubt Clearing Session'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'interview meeting',
  },
  {
    id: 'counselling-session',
    name: 'Personal Counselling Session',
    description: 'Guidance and mentorship to help you prepare mentally and strategically for the SSB.',
    price: 1499,
    features: ['Career Path Guidance', 'Strengths & Weaknesses Analysis', 'Confidence Building Techniques', 'SSB Procedure Walkthrough'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'counseling support',
  },
  {
    id: 'afcat-guidance',
    name: 'AFCAT Exam Guidance',
    description: 'Expert guidance and study strategies to crack the AFCAT exam.',
    price: 999,
    features: ['Syllabus Overview', 'Study Material Recommendation', 'Time Management Tips', 'Mock Test Strategy'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'exam preparation',
  },
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Rohan Sharma',
    batch: 'NDA Aspirant',
    story: "The mock interview was incredibly realistic and the feedback helped me identify my weak areas. Cleared SSB in my first attempt!",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'happy student',
    serviceTaken: 'SSB Mock Interview',
  },
  {
    id: '2',
    name: 'Priya Singh',
    batch: 'CDS Aspirant',
    story: "The counselling session gave me the confidence I needed. The insights into the SSB process were invaluable.",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'smiling person',
    serviceTaken: 'Personal Counselling Session',
  },
  {
    id: '3',
    name: 'Amit Patel',
    batch: 'AFCAT Aspirant',
    story: "Thanks to the AFCAT guidance, I was able to structure my preparation effectively and scored well. Highly recommended!",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'focused individual',
    serviceTaken: 'AFCAT Exam Guidance',
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking1',
    serviceName: 'SSB Mock Interview',
    date: '2024-08-15',
    time: '10:00 AM',
    meetingLink: 'https://meet.google.com/xyz-abc-pqr',
    status: 'upcoming',
  },
  {
    id: 'booking2',
    serviceName: 'Personal Counselling Session',
    date: '2024-07-20',
    time: '02:00 PM',
    meetingLink: 'https://meet.google.com/def-ghi-jkl',
    status: 'completed',
    reportUrl: '/path/to/report.pdf',
  },
];

export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res1',
    title: 'SSB Interview Guide PDF',
    type: 'document',
    url: '/resources/ssb_guide.pdf',
    description: 'A comprehensive guide covering all aspects of the SSB interview.',
    serviceCategory: 'ssb-mock-interview',
    icon: FileText,
  },
  {
    id: 'res2',
    title: 'Psychological Test Practice Video',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=example',
    description: 'Video tutorial on how to approach psychological tests.',
    serviceCategory: 'ssb-mock-interview',
    icon: Video,
  },
  {
    id: 'res3',
    title: 'AFCAT Study Plan',
    type: 'document',
    url: '/resources/afcat_study_plan.pdf',
    description: 'A structured study plan for AFCAT preparation.',
    serviceCategory: 'afcat-guidance',
    icon: FileText,
  },
  {
    id: 'res4',
    title: 'Important Defence News',
    type: 'link',
    url: 'https://www.indiandefensenews.in/',
    description: 'Stay updated with the latest in defence.',
    serviceCategory: 'general',
    icon: LinkIcon,
  }
];

export const DASHBOARD_NAV_LINKS = [
  { href: '/dashboard', label: 'Overview', icon: Shield },
  { href: '/dashboard/bookings', label: 'My Bookings', icon: CalendarDays },
  { href: '/dashboard/resources', label: 'My Resources', icon: FileText },
  { href: '/dashboard/profile', label: 'Profile', icon: Users },
];

export const AVAILABLE_SLOTS: Record<string, string[]> = {
  "2024-09-01": ["09:00 AM", "11:00 AM", "02:00 PM"],
  "2024-09-02": ["10:00 AM", "01:00 PM", "03:00 PM"],
  "2024-09-03": ["09:30 AM", "11:30 AM"],
};

export const USER_FORM_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter your email' },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter your phone number' },
  { name: 'examApplied', label: 'Defense Exams Applied For', type: 'text', placeholder: 'e.g., NDA, CDS, AFCAT' },
  { name: 'previousAttempts', label: 'Previous SSB Attempts (if any)', type: 'number', placeholder: '0' },
];
