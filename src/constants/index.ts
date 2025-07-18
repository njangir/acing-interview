
// TODO: PRODUCTION REFACTOR - The mock data arrays in this file (MOCK_SERVICES, MOCK_BOOKINGS, MOCK_TESTIMONIALS, etc.)
// are placeholders for development. In a production environment, this data will be fetched from and managed in Firestore.
// Each mock array should be replaced by appropriate Firestore queries in the components/pages that use them.

import type { Service, Testimonial, Booking, Resource, MentorProfileData, UserMessage, Badge, UserProfile, FeedbackSubmissionHistoryEntry } from '@/types';
import { Shield, Video, FileText, Link as LinkIcon, CalendarDays, Users, UserSquare2, ListChecks, Edit3, UploadCloud, BookCopy, MessageSquare, UserCog, CalendarPlus, MailQuestion, MessagesSquare, Award, Edit2Icon, DownloadCloud, Sparkles } from 'lucide-react';
import { getFutureDate } from '@/lib/utils'; // Updated import path

// TODO: PRODUCTION REFACTOR - This will be fetched from the 'avatars' or similar static asset configuration.
export const PREDEFINED_AVATARS: {id: string, url: string, hint: string}[] = [
  { id: 'avatar1', url: 'https://placehold.co/100x100/EBF4FF/76A9FA?text=U1', hint: 'abstract user icon blue' },
  { id: 'avatar2', url: 'https://placehold.co/100x100/FFF0EB/FA9F76?text=U2', hint: 'abstract user icon orange' },
  { id: 'avatar3', url: 'https://placehold.co/100x100/EBFFF2/76FA91?text=U3', hint: 'abstract user icon green' },
  { id: 'avatar4', url: 'https://placehold.co/100x100/F9EBFF/C576FA?text=U4', hint: 'abstract user icon purple' },
  { id: 'avatar5', url: 'https://placehold.co/100x100/FFFDEB/F5E66B?text=U5', hint: 'abstract user icon yellow' },
  { id: 'avatar6', url: 'https://placehold.co/100x100/FFEBEE/FA7689?text=U6', hint: 'abstract user icon red' },
];

// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'services'
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
    defaultForce: 'Army',
    isBookable: true,
    // TODO: PRODUCTION - Add createdAt, updatedAt (Firestore Timestamps)
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
    defaultForce: 'Army',
    isBookable: true,
    // TODO: PRODUCTION - Add createdAt, updatedAt (Firestore Timestamps)
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
    isBookable: false, // Example of a non-bookable service
    // TODO: PRODUCTION - Add createdAt, updatedAt (Firestore Timestamps)
  },
];

// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'testimonials'
// Testimonials should link to a user via uid.
export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: 't1', // Firestore auto-ID
    uid: 'mockUser1Uid', // Link to user
    name: 'Rohan Sharma',
    userEmail: 'aspirant@example.com',
    batch: 'NDA Aspirant',
    story: "The mock interview was incredibly realistic and the feedback helped me identify my weak areas. Cleared SSB in my first attempt! The resources provided were also top-notch.",
    imageUrl: 'https://placehold.co/100x100.png', 
    dataAiHint: 'happy student', 
    serviceTaken: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview', // Link to service
    submissionStatus: 'selected_cleared',
    status: 'approved',
    bodyImageUrl: 'https://placehold.co/400x300.png', 
    bodyImageDataAiHint: 'celebration success', 
    createdAt: new Date().toISOString(), // Firestore Timestamp
    updatedAt: new Date().toISOString(), // Firestore Timestamp
  },
  {
    id: 't2',
    uid: 'mockUser2Uid',
    name: 'Priya Singh',
    userEmail: 'priya.singh@example.com',
    batch: 'CDS Aspirant',
    story: "The counselling session gave me the confidence I needed. The insights into the SSB process were invaluable. Highly recommend for anyone serious about joining the forces.",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'smiling person',
    serviceTaken: 'Personal Counselling Session',
    serviceId: 'personal-counselling-session',
    submissionStatus: 'aspirant',
    status: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't3',
    uid: 'mockUser3Uid',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't4',
    uid: 'mockUser4Uid',
    name: 'Sneha Reddy',
    userEmail: 'sneha.reddy@example.com',
    batch: 'SSB Aspirant',
    story: "The mentor's profile was very inspiring. The guidance was top-notch, helped me improve my approach to the psychological tests significantly.",
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'confident woman',
    serviceTaken: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview',
    submissionStatus: 'aspirant',
    status: 'pending',
    bodyImageUrl: 'https://placehold.co/300x400.png',
    bodyImageDataAiHint: 'study learning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'bookings'
// Bookings should link to a user via uid and service via serviceId.
export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking1', // Firestore auto-ID
    uid: 'mockUserAnanyaUid', // Link to user
    serviceName: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview', // Link to service
    date: getFutureDate(3),
    time: '10:00 AM',
    userName: "Ananya Sharma",
    userEmail: "ananya.sharma@example.com",
    meetingLink: 'https://meet.google.com/xyz-abc-pqr', // Consider generating/storing via backend
    status: 'scheduled',
    paymentStatus: 'paid',
    transactionId: 'txn_ananya_ssb_mock_01', // From payment gateway
    requestedRefund: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Example past date
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'booking2',
    uid: 'mockUserVikramUid',
    serviceName: 'Personal Counselling Session',
    serviceId: 'personal-counselling-session',
    date: '2024-07-10',
    time: '02:00 PM',
    userName: "Vikram Singh",
    userEmail: "vikram.singh@example.com",
    meetingLink: 'https://meet.google.com/def-ghi-jkl',
    status: 'completed',
    paymentStatus: 'paid',
    transactionId: 'txn_vikram_counsel_01',
    reportUrl: '/resources/mock_feedback_report.pdf', // Store in Firebase Storage, URL here
    detailedFeedback: [
        { skill: 'Communication Skills', rating: 'Excellent', comments: 'Very articulate and clear.' },
        { skill: 'Officer-Like Qualities (OLQs)', rating: 'Good', comments: 'Shows potential, needs to be more assertive.' },
        { skill: 'General Awareness', rating: 'Satisfactory', comments: 'Good grasp of current affairs but can improve on specifics.' },
    ],
    createdAt: new Date('2024-07-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-10T14:30:00Z').toISOString(),
  },
  {
    id: 'booking3',
    uid: 'mockUserNishaUid',
    serviceName: 'AFCAT Exam Guidance',
    serviceId: 'afcat-exam-guidance',
    date: getFutureDate(5),
    time: '03:00 PM',
    userName: "Nisha Patel",
    userEmail: "nisha.patel@example.com",
    meetingLink: '',
    status: 'pending_approval',
    paymentStatus: 'pay_later_pending',
    transactionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
   {
    id: 'booking4',
    uid: 'mockUserRajeshUid',
    serviceName: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview',
    date: getFutureDate(10),
    time: '11:00 AM',
    userName: "Rajesh Kumar",
    userEmail: "rajesh.kumar@example.com",
    meetingLink: '',
    status: 'accepted',
    paymentStatus: 'pay_later_pending',
    transactionId: null,
    requestedRefund: true,
    refundReason: "Unexpected travel conflict. Unable to attend the session.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
   {
    id: 'booking5',
    uid: 'aspirantUserUid', // Linked to our test aspirant
    serviceName: 'Personal Counselling Session',
    serviceId: 'personal-counselling-session',
    date: getFutureDate(-2), 
    time: '04:00 PM',
    userName: "Priya Desai", 
    userEmail: "aspirant@example.com", 
    meetingLink: 'https://meet.google.com/123-456-789',
    status: 'completed', 
    paymentStatus: 'paid',
    transactionId: 'txn_priya_counsel_02',
    reportUrl: '/resources/mock_feedback_priya_01.pdf', 
    detailedFeedback: [ 
        { skill: 'Communication Skills', rating: 'Very Good', comments: 'Clear and concise in responses.' },
        { skill: 'Confidence Level', rating: 'Good', comments: 'Showed good confidence, can be more assertive in group tasks.' },
        { skill: 'Problem Solving Ability', rating: 'Excellent', comments: 'Approached problems logically and found creative solutions.' },
        { skill: 'General Awareness', rating: 'Satisfactory', comments: 'Needs to brush up on recent national events.' },
        { skill: 'Officer-Like Qualities (OLQs)', rating: 'Outstanding' },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'booking6',
    uid: 'mockUserAmitUid',
    serviceName: 'AFCAT Exam Guidance',
    serviceId: 'afcat-exam-guidance',
    date: '2024-07-12',
    time: '11:00 AM',
    userName: "Amit Patel",
    userEmail: "amit.patel@example.com",
    meetingLink: 'https://meet.google.com/amit-afcat-link',
    status: 'completed',
    paymentStatus: 'paid',
    transactionId: 'txn_amit_afcat_01',
    detailedFeedback: [
      { skill: 'AFCAT Exam Knowledge', rating: 'Good', comments: 'Understands the syllabus well.' },
      { skill: 'Time Management Strategy', rating: 'Satisfactory', comments: 'Needs to practice more timed tests.' },
      { skill: 'Problem Solving Ability', rating: 'Very Good'},
    ],
    createdAt: new Date('2024-07-05T00:00:00Z').toISOString(),
    updatedAt: new Date('2024-07-12T11:30:00Z').toISOString(),
  },
  {
    id: 'booking7',
    uid: 'aspirantUserUid', // Linked to our test aspirant
    serviceName: 'SSB Mock Interview',
    serviceId: 'ssb-mock-interview',
    date: getFutureDate(-10),
    time: '09:00 AM',
    userName: "Aspirant TestUser",
    userEmail: "aspirant@example.com",
    meetingLink: 'https://meet.google.com/aspirant-mock-ssb',
    status: 'completed',
    paymentStatus: 'paid',
    transactionId: 'txn_aspirant_ssb_007',
    reportUrl: '/resources/mock_feedback_aspirant_007.pdf',
    detailedFeedback: [
        { skill: 'Communication Skills', rating: 'Good' },
        { skill: 'Officer-Like Qualities (OLQs)', rating: 'Very Good' },
        { skill: 'Confidence Level', rating: 'Excellent' },
        { skill: 'Group Interaction', rating: 'Satisfactory' },
    ],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'resources'
// Resources could be stored in Firebase Storage (for files) and URLs/metadata in Firestore.
export const MOCK_RESOURCES: Resource[] = [
  {
    id: 'res1', // Firestore auto-ID
    title: 'SSB Interview Guide PDF',
    type: 'document',
    url: '/resources/ssb_guide.pdf', // Storage URL
    description: 'A comprehensive guide covering all aspects of the SSB interview.',
    serviceCategory: 'ssb-mock-interview', // Or a more generic category system
    icon: FileText,
    createdAt: new Date().toISOString(), // Firestore Timestamp
    updatedAt: new Date().toISOString(), // Firestore Timestamp
  },
  {
    id: 'res2',
    title: 'Psychological Test Practice Video',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=example', // External URL
    description: 'Video tutorial on how to approach psychological tests.',
    serviceCategory: 'ssb-mock-interview',
    icon: Video,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res3',
    title: 'AFCAT Study Plan',
    type: 'document',
    url: '/resources/afcat_study_plan.pdf',
    description: 'A structured study plan for AFCAT preparation.',
    serviceCategory: 'afcat-exam-guidance',
    icon: FileText,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'res4',
    title: 'Important Defence News',
    type: 'link',
    url: 'https://www.indiandefensenews.in/',
    description: 'Stay updated with the latest in defence.',
    serviceCategory: 'general',
    icon: LinkIcon,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// TODO: PRODUCTION REFACTOR - These navigation links are UI specific and likely to remain static.
// However, some parts might be conditional based on user roles/permissions if expanded.
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
  { href: '/admin/badges', label: 'Manage Badges', icon: Award },
  { href: '/admin/export-reports', label: 'Export Reports', icon: DownloadCloud },
];

// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'availableSlots' or similar dynamic system.
// This should be managed by admins and fetched dynamically.
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

// TODO: PRODUCTION REFACTOR - Replace with Firestore document for 'mentorProfile' (or similar singleton collection).
export const MENTOR_PROFILE: MentorProfileData = {
  name: "Kanika Sharma",
  title: "SSB Mentor | Defence Enthusiast | National Security Professional",
  imageUrl: "https://placehold.co/300x300.png", // Store in Firebase Storage, URL here
  dataAiHint: "female mentor portrait",
  bio: "I’m Kanika Sharma, a passionate defence aspirant turned mentor with a track record of 4 SSB recommendations for the Indian Army and Indian Air Force, including the prestigious Flying Branch.\n\t•\t✅ First woman candidate to be recommended for the IAF Flying Branch through NCC Entry\n\t•\t✅ Cleared the challenging CPSS (Computerized Pilot Selection System) exam — a gateway to becoming a military pilot in the Indian Air Force\n\t•\t✅ NCC ‘C’ Certificate holder, trained, tested, and trusted under the nation’s finest leadership framework\n\t•\t✅ Currently serving in one of the top national security departments of the Government of India\n\nThough I may not wear the uniform, I work every day with the mission to secure the nation and now dedicate myself to helping the next generation of officers in uniform.",
  experience: [
    "4 SSB recommendations for the Indian Army and Indian Air Force",
    "First woman candidate to be recommended for the IAF Flying Branch through NCC Entry",
    "Cleared the challenging CPSS (Computerized Pilot Selection System) exam",
    "NCC ‘C’ Certificate holder",
    "Currently serving in a top national security department of the Government of India",
  ],
  philosophy: "I’ve walked your path, faced the Service Selection Board, and cracked it four times. I know exactly what it takes — and more importantly, what not to do. My mentorship is for serious aspirants who want to:\n\t•\t✅ Understand OLQs (Officer-Like Qualities) at a deeper level\n\t•\t✅ Master the psych tests, GTO tasks, and personal interviews\n\t•\t✅ Build the right mindset and personality for selection\n\t•\t✅ Get real, honest feedback and personalized strategy\n\t•\t✅ Be mentored by someone who’s lived the journey",
  quote: "You don’t need a uniform to serve the nation — but if you wear one in your dreams, I’m here to guide you to it.",
  contactEmail: "kanika.sharma.mentor@armedforcesinterviewace.com",
  contactPhone: "+91 9000000000",
  // TODO: PRODUCTION - Add createdAt, updatedAt (Firestore Timestamps)
};

// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'userMessages'
// Messages should link to a user via uid.
export const MOCK_USER_MESSAGES: UserMessage[] = [
  {
    id: 'msg1', // Firestore auto-ID
    uid: 'mockUserRohanUid', // Link to user
    userName: 'Rohan Sharma',
    userEmail: 'aspirant@example.com',
    subject: 'Question about GTO tasks',
    messageBody: 'Hello, I had a quick question regarding the GTO tasks for the SSB mock interview. Could you please elaborate on what to expect?',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Firestore Timestamp
    status: 'replied',
    senderType: 'user',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg1-reply1',
    uid: 'adminUserUid', // Or system UID
    userName: 'Rohan Sharma', // Context: to which user was this reply
    userEmail: 'aspirant@example.com',
    subject: 'Re: Question about GTO tasks',
    messageBody: 'Hi Rohan, GTO tasks typically include group discussions, group planning exercises, progressive group tasks, etc. We cover these in detail during the mock interview. Let me know if you have specific concerns!',
    timestamp: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'replied',
    senderType: 'admin',
    adminName: 'Admin Team',
    createdAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'msg2',
    uid: 'mockUserPriyaUid',
    userName: 'Priya Singh',
    userEmail: 'priya.singh@example.com',
    subject: 'Reschedule Counselling Session',
    messageBody: 'Is it possible to reschedule my counselling session from next Tuesday to Wednesday? Please let me know.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'new',
    senderType: 'user',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// TODO: PRODUCTION REFACTOR - This is a mock for contact page. User data comes from auth context.
export const MOCK_USER_PROFILE_FOR_CONTACT: UserProfile = {
  uid: 'aspirantUserUid',
  name: "Test User",
  email: "aspirant@example.com",
  phone: "1234567890",
  imageUrl: PREDEFINED_AVATARS[0].url,
  awardedBadges: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'badges'
export const MOCK_BADGES: Badge[] = [
  {
    id: 'af_pilot_aspirant', // Firestore auto-ID or custom ID
    name: 'Pilot Aspirant Badge',
    description: 'Awarded for showing strong aptitude towards aviation concepts during AFCAT guidance.',
    force: 'Air Force',
    rankName: 'Pilot Aspirant',
    imageUrl: 'https://placehold.co/100x100.png', // Store in Firebase Storage, URL here
    dataAiHint: 'air force pilot insignia',
    createdAt: new Date().toISOString(), // Firestore Timestamp
    updatedAt: new Date().toISOString(), // Firestore Timestamp
  },
  {
    id: 'army_leadership_potential',
    name: 'Leadership Potential Badge',
    description: 'Recognized for demonstrating key leadership qualities in SSB mock interview.',
    force: 'Army',
    rankName: 'Officer Candidate',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'army officer badge',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'navy_strategic_thinker',
    name: 'Strategic Thinker Badge',
    description: 'Commended for excellent strategic thinking during SSB counselling.',
    force: 'Navy',
    rankName: 'Midshipman Aspirant',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'navy insignia',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ssb_screened_in',
    name: 'SSB Stage-I Cleared Badge',
    description: 'Successfully cleared Stage-I of the SSB mock process.',
    force: 'General',
    rankName: 'Stage-I Qualified',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'achievement badge',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'commendable_effort',
    name: 'Commendable Effort Badge',
    description: 'Awarded for outstanding effort and dedication during preparation.',
    force: 'General',
    rankName: 'Dedicated Learner',
    imageUrl: 'https://placehold.co/100x100.png',
    dataAiHint: 'star award',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// TODO: PRODUCTION REFACTOR - These skill definitions could be stored in a 'skillDefinitions' collection in Firestore
// if they need to be dynamically managed by admins, or remain as constants if stable.
export const PREDEFINED_SKILLS: string[] = [
    "Communication Skills",
    "Officer-Like Qualities (OLQs)",
    "General Awareness",
    "Confidence Level",
    "Problem Solving Ability",
    "Group Interaction",
    "Technical Knowledge (if applicable)",
    "AFCAT Exam Knowledge",
    "Time Management Strategy",
];

export const SKILL_RATINGS: string[] = [
    "Needs Significant Improvement", // 1
    "Needs Improvement",             // 2
    "Satisfactory",                  // 3
    "Good",                          // 4
    "Very Good",                     // 5
    "Excellent",                     // 6
    "Outstanding",                   // 7
];

export const SKILL_RATING_VALUES: Record<string, number> = {
  "Needs Significant Improvement": 1,
  "Needs Improvement": 2,
  "Satisfactory": 3,
  "Good": 4,
  "Very Good": 5,
  "Excellent": 6,
  "Outstanding": 7,
};

export const MAX_SKILL_RATING_VALUE = 7;
export const TARGET_SKILL_RATING_VALUE = 4; // Represents "Good"


// TODO: PRODUCTION REFACTOR - Replace with Firestore collection 'feedbackSubmissions' or similar.
// This history tracks admin actions of uploading feedback.
export const MOCK_SUBMISSION_HISTORY: FeedbackSubmissionHistoryEntry[] = [];
// Example entry structure (would be added dynamically by admin actions):
// {
//   id: 'hist-123', // Firestore auto-ID
//   submissionDate: new Date().toISOString(), // Firestore Timestamp
//   bookingId: 'booking1', // Link to booking
//   adminUid: 'adminUserUid', // Link to admin user who performed action
//   userName: 'Ananya Sharma', // User for whom feedback was submitted
//   serviceName: 'SSB Mock Interview',
//   reportFileName: 'ananya_sharma_feedback.pdf', // Name of the uploaded file
//   reportUrl: 'storage_url_to_pdf', // Actual URL from Firebase Storage
//   badgeAssignedId: 'commendable_effort', // Optional: ID of badge assigned
//   badgeAssignedName: 'Commendable Effort', // Optional: Name of badge assigned
//   createdAt: new Date().toISOString(),
// }
