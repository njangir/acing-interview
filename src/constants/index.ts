
import type { Service, Testimonial, Booking, Resource, MentorProfileData, UserMessage, Badge } from '@/types';
import { Shield, Video, FileText, Link as LinkIcon, CalendarDays, Users, UserSquare2, ListChecks, Edit3, UploadCloud, BookCopy, MessageSquare, UserCog, CalendarPlus, MailQuestion, MessagesSquare, Award, Edit2Icon } from 'lucide-react';

const today = new Date();
export function getFutureDate(daysToAdd: number): string {
  const futureDate = new Date(today);
  futureDate.setDate(today.getDate() + daysToAdd);
  return futureDate.toISOString().split('T')[0];
};

export const MOCK_SERVICES: Service[] = [
  {
    id: 'ssb-mock-interview',
    name: 'SSB Mock Interview',
    description: 'Comprehensive mock interview simulating the actual SSB experience with personalized feedback.',
    price: 2999,
    duration: '90 mins',
    features: ['One-on-One Interview', 'Psychological Test Analysis (TAT, WAT, SRT)', 'GTO Task Briefing', 'Personalized Feedback Report', 'Doubt Clearing Session'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'interview meeting',
    defaultForce: 'General',
  },
  {
    id: 'personal-counselling-session',
    name: 'Personal Counselling Session',
    description: 'Guidance and mentorship to help you prepare mentally and strategically for the SSB.',
    price: 1499,
    duration: '60 mins',
    features: ['Career Path Guidance', 'Strengths & Weaknesses Analysis', 'Confidence Building Techniques', 'SSB Procedure Walkthrough'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'counseling support',
    defaultForce: 'General',
  },
  {
    id: 'afcat-exam-guidance',
    name: 'AFCAT Exam Guidance',
    description: 'Expert guidance and study strategies to crack the AFCAT exam.',
    price: 999,
    duration: '45 mins',
    features: ['Syllabus Overview', 'Study Material Recommendation', 'Time Management Tips', 'Mock Test Strategy'],
    image: 'https://placehold.co/600x400.png',
    dataAiHint: 'exam preparation',
    defaultForce: 'Air Force',
  },
];

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Rohan Sharma',
    userEmail: 'aspirant@example.com', 
    batch: 'NDA Aspirant',
    story: "The mock interview was incredibly realistic and the feedback helped me identify my weak areas. Cleared SSB in my first attempt!",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'happy student',
    serviceTaken: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview',
    submissionStatus: 'selected_cleared',
    status: 'approved',
  },
  {
    id: 't2',
    name: 'Priya Singh',
    userEmail: 'priya.singh@example.com',
    batch: 'CDS Aspirant',
    story: "The counselling session gave me the confidence I needed. The insights into the SSB process were invaluable.",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'smiling person',
    serviceTaken: 'Personal Counselling Session',
    serviceId: 'personal-counselling-session',
    submissionStatus: 'aspirant',
    status: 'approved',
  },
  {
    id: 't3',
    name: 'Amit Patel',
    userEmail: 'amit.patel@example.com',
    batch: 'AFCAT Aspirant',
    story: "Thanks to the AFCAT guidance, I was able to structure my preparation effectively and scored well. Highly recommended!",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'focused individual',
    serviceTaken: 'AFCAT Exam Guidance',
    serviceId: 'afcat-exam-guidance',
    submissionStatus: 'selected_cleared',
    status: 'approved',
  },
  {
    id: 't4',
    name: 'Sneha Reddy',
    userEmail: 'sneha.reddy@example.com',
    batch: 'SSB Aspirant',
    story: "The mentor's profile was very inspiring. The guidance was top-notch.",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'confident woman',
    serviceTaken: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview',
    submissionStatus: 'aspirant',
    status: 'pending',
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking1',
    serviceName: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview',
    date: getFutureDate(3), 
    time: '10:00 AM',
    userName: "Ananya Sharma",
    userEmail: "ananya.sharma@example.com",
    meetingLink: 'https://meet.google.com/xyz-abc-pqr',
    status: 'upcoming',
    paymentStatus: 'paid',
    requestedRefund: false,
  },
  {
    id: 'booking2',
    serviceName: 'Personal Counselling Session',
    serviceId: 'personal-counselling-session',
    date: '2024-07-10', 
    time: '02:00 PM',
    userName: "Vikram Singh",
    userEmail: "vikram.singh@example.com",
    meetingLink: 'https://meet.google.com/def-ghi-jkl',
    status: 'completed',
    paymentStatus: 'paid',
    reportUrl: '/path/to/report.pdf',
  },
  {
    id: 'booking3',
    serviceName: 'AFCAT Exam Guidance',
    serviceId: 'afcat-exam-guidance',
    date: getFutureDate(5),
    time: '03:00 PM',
    userName: "Nisha Patel",
    userEmail: "nisha.patel@example.com", 
    meetingLink: 'https://meet.google.com/mno-pqr-stu',
    status: 'pending_approval',
    paymentStatus: 'pay_later_pending',
  },
   {
    id: 'booking4',
    serviceName: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview',
    date: getFutureDate(10),
    time: '11:00 AM',
    userName: "Rajesh Kumar",
    userEmail: "rajesh.kumar@example.com",
    meetingLink: 'https://meet.google.com/uvw-xyz-123',
    status: 'upcoming', 
    paymentStatus: 'pay_later_pending',
    requestedRefund: true,
    refundReason: "Unexpected travel conflict. Unable to attend the session.",
  },
   {
    id: 'booking5',
    serviceName: 'Personal Counselling Session',
    serviceId: 'personal-counselling-session',
    date: getFutureDate(1), 
    time: '04:00 PM',
    userName: "Priya Desai",
    userEmail: "aspirant@example.com",
    meetingLink: 'https://meet.google.com/123-456-789',
    status: 'upcoming',
    paymentStatus: 'paid',
  },
  {
    id: 'booking6',
    serviceName: 'AFCAT Exam Guidance',
    serviceId: 'afcat-exam-guidance',
    date: '2024-07-12', 
    time: '11:00 AM',
    userName: "Amit Patel", 
    userEmail: "amit.patel@example.com", 
    meetingLink: 'https://meet.google.com/amit-afcat-link',
    status: 'completed',
    paymentStatus: 'paid',
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
    serviceCategory: 'afcat-exam-guidance',
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
  { href: '/dashboard/profile', label: 'Profile & Badges', icon: Users },
  { href: '/dashboard/submit-testimonial', label: 'Submit Testimonial', icon: Edit2Icon },
  { href: '/dashboard/contact', label: 'Contact Support', icon: MailQuestion },
];

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
];

// Represents the available slots that admins can manage.
// In a real app, this would be fetched from and updated to a backend.
// Admin slot page will show a toast for simulation and not modify this directly.
export const AVAILABLE_SLOTS: Record<string, string[]> = {
  [getFutureDate(7)]: ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM"],
  [getFutureDate(8)]: ["10:00 AM", "01:00 PM", "03:00 PM"],
  [getFutureDate(9)]: ["09:30 AM", "11:30 AM", "02:30 PM"],
  [getFutureDate(14)]: ["10:00 AM", "12:00 PM", "03:00 PM"],
  [getFutureDate(15)]: ["09:00 AM", "11:00 AM"],
  [getFutureDate(20)]: ["10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"],
  [getFutureDate(21)]: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM"],
  [getFutureDate(60)]: ["10:00 AM", "11:00 AM", "12:00 PM"], 
  [getFutureDate(61)]: ["02:00 PM", "03:00 PM", "04:00 PM"],
  [getFutureDate(3)]: ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"],
  [getFutureDate(1)]: ["02:00 PM", "03:00 PM", "04:00 PM"],
};

export const USER_FORM_FIELDS = [
  { name: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter your email' },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Enter your phone number' },
  { name: 'examApplied', label: 'Defense Exams Applied For', type: 'text', placeholder: 'e.g., NDA, CDS, AFCAT' },
  { name: 'previousAttempts', label: 'Previous SSB Attempts (if any)', type: 'number', placeholder: '0' },
];

export const MENTOR_PROFILE: MentorProfileData = {
  name: "Col. (Retd.) Arjun Singh",
  title: "Lead Mentor & SSB Expert",
  imageUrl: "https://placehold.co/300x300.png",
  dataAiHint: "mentor portrait",
  bio: "Col. (Retd.) Arjun Singh is a seasoned veteran with an illustrious career in the Indian Armed Forces. Having successfully cleared the Services Selection Board (SSB) an exceptional seven times for various entries, he possesses an unparalleled understanding of the selection process. His passion for mentoring and guiding young aspirants has led him to help countless candidates achieve their dreams of joining the forces.",
  experience: [
    "7-time SSB cleared (NDA, IMA, OTA, TES, UES, NCC Special Entry, TA)",
    "Over 20 years of distinguished service in the Indian Army.",
    "Expert in psychological testing, interview techniques, and GTO tasks.",
    "Certified assessor and trainer.",
    "Proven track record of mentoring successful candidates.",
  ],
  philosophy: "My approach is to demystify the SSB process and empower candidates with self-awareness and genuine confidence. I focus on honing their innate abilities rather than prescribing coached responses. Success in SSB is about showcasing your true potential, and I am here to help you discover and project that effectively.",
  quote: "The best way to predict your future is to create it. Let's create yours in the Armed Forces.",
  contactEmail: "arjun.singh.mentor@example.com",
  contactPhone: "+91 9988776655"
};

// User messages are now only added via contact form simulation (toast message)
// This array serves as initial data for the admin message viewing UI
export const MOCK_USER_MESSAGES: UserMessage[] = [
  {
    id: 'msg1',
    userName: 'Rohan Sharma',
    userEmail: 'aspirant@example.com',
    subject: 'Question about GTO tasks',
    messageBody: 'Hello, I had a quick question regarding the GTO tasks for the SSB mock interview. Could you please elaborate on what to expect?',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'new',
  },
  {
    id: 'msg2',
    userName: 'Priya Singh',
    userEmail: 'priya.singh@example.com',
    subject: 'Reschedule Counselling Session',
    messageBody: 'Is it possible to reschedule my counselling session from next Tuesday to Wednesday? Please let me know.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: 'read',
  },
];

// Mock user profile for contact page display (in a real app, this comes from auth)
export const MOCK_USER_PROFILE_FOR_CONTACT = {
  name: "Test User",
  email: "testuser@example.com",
};

export const MOCK_BADGES: Badge[] = [
  {
    id: 'af_pilot_aspirant',
    name: 'Pilot Aspirant Badge',
    description: 'Awarded for showing strong aptitude towards aviation concepts during AFCAT guidance.',
    force: 'Air Force',
    rankName: 'Pilot Aspirant',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'air force pilot insignia',
  },
  {
    id: 'army_leadership_potential',
    name: 'Leadership Potential Badge',
    description: 'Recognized for demonstrating key leadership qualities in SSB mock interview.',
    force: 'Army',
    rankName: 'Officer Candidate',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'army officer badge',
  },
  {
    id: 'navy_strategic_thinker',
    name: 'Strategic Thinker Badge',
    description: 'Commended for excellent strategic thinking during SSB counselling.',
    force: 'Navy',
    rankName: 'Midshipman Aspirant',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'navy insignia',
  },
  {
    id: 'ssb_screened_in',
    name: 'SSB Stage-I Cleared Badge',
    description: 'Successfully cleared Stage-I of the SSB mock process.',
    force: 'General',
    rankName: 'Stage-I Qualified',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'achievement badge',
  },
  {
    id: 'commendable_effort',
    name: 'Commendable Effort Badge',
    description: 'Awarded for outstanding effort and dedication during preparation.',
    force: 'General',
    rankName: 'Dedicated Learner',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'star award',
  }
];
