
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
  requestedRefund?: boolean;
  refundReason?: string;
  transactionId?: string | null;
  detailedFeedback?: { skill: string; rating: string; comments?: string }[];
  createdAt?: any;
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
