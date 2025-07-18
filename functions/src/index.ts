/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onRequest, onCall } from "firebase-functions/v2/https";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue, QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import { defineString } from "firebase-functions/params";
import * as crypto from "crypto";

// Initialize Firebase Admin
initializeApp();

const auth = getAuth();
const db = getFirestore();

// Define environment parameters
const razorpayKeyId = defineString("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineString("RAZORPAY_KEY_SECRET");

// Initialize Razorpay instance using environment variables
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: razorpayKeyId.value(),
    key_secret: razorpayKeySecret.value(),
  });
};

// Utility to check authentication
function requireAuth(request: any) {
  if (!request.auth) {
    throw new Error("Unauthorized");
  }
}

// Utility to check admin
async function requireAdmin(request: any, auth: any) {
  requireAuth(request);
  let uid: string;
  if (request.auth && request.auth.uid) {
    uid = request.auth.uid;
  } else {
    throw new Error("Unauthorized");
  }
  
  try {
    const userRecord = await auth.getUser(uid);
    const customClaims = userRecord.customClaims;
    if (!customClaims?.isAdmin) {
      throw new Error("Admin access required");
    }
  } catch (error) {
    logger.error(`Error checking admin status for user ${uid}:`, error);
    throw new Error("Admin access verification failed");
  }
}

// Input validation helpers
function validateBookingDetails(bookingDetails: any) {
  if (!bookingDetails || typeof bookingDetails !== "object") {
    throw new Error("Invalid booking details");
  }
  if (!bookingDetails.serviceName || typeof bookingDetails.serviceName !== "string") {
    throw new Error("Service name is required");
  }
}

function validatePaymentData(data: any) {
  if (!data.paymentId || !data.orderId || !data.signature || !data.bookingId) {
    throw new Error("Missing required payment data");
  }
}

// User Profile Creation on Sign Up
export const onUserCreate = onDocumentCreated("userProfiles/{userId}", async (event) => {
  const userId = event.params.userId;
  if (!event.data) {
    logger.error(`No event.data found for userId=${userId} in onUserCreate`);
    return;
  }
  
  const userData = event.data.data();
  try {
    // Set custom claims for admin users (you can modify this logic)
    if (userData?.email === "admin@example.com") {
      await auth.setCustomUserClaims(userId, { isAdmin: true, role: "admin" });
    }
    logger.info(`User profile created for ${userId}`);
  } catch (error) {
    logger.error("Error in onUserCreate:", error);
  }
});

// Create Payment Order
export const createPaymentOrder = onCall({ 
  maxInstances: 10,
  memory: "256MiB",
  timeoutSeconds: 60
}, async (request) => {
  try {
    const { bookingDetails, servicePrice, userId } = request.data;
    requireAuth(request);

    // Validate input
    validateBookingDetails(bookingDetails);
    if (!servicePrice || typeof servicePrice !== "number" || servicePrice <= 0) {
      throw new Error("Invalid service price");
    }
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid user ID");
    }

    const razorpay = getRazorpayInstance();

    // Create a real Razorpay order
    const options = {
      amount: Math.round(servicePrice * 100), // amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${userId}`,
      payment_capture: 1,
      notes: {
        serviceName: bookingDetails.serviceName,
        userId,
      },
    };

    const order = await razorpay.orders.create(options);
    logger.info(`Created Razorpay order: ${order.id} for booking: ${bookingDetails.serviceName} by user: ${userId}`);

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      gatewayKey: razorpayKeyId.value(), // Send public key to client
      message: "Payment order created successfully",
    };
  } catch (error) {
    logger.error(`Error creating payment order:`, error);
    throw new Error(`Failed to create payment order: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

// Helper to verify payment signature using Razorpay's HMAC SHA256
function verifyPaymentSignature(paymentId: string, orderId: string, signature: string): boolean {
  try {
    const keySecret = razorpayKeySecret.value();
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(orderId + "|" + paymentId)
      .digest("hex");
    
    logger.info(`Verifying payment: paymentId=${paymentId}, orderId=${orderId}`);
    return generatedSignature === signature;
  } catch (error) {
    logger.error("Error verifying payment signature:", error);
    return false;
  }
}

// Confirm Booking after Payment
export const confirmBooking = onCall({ 
  maxInstances: 10,
  memory: "256MiB",
  timeoutSeconds: 60
}, async (request) => {
  try {
    const { paymentId, orderId, signature, bookingId } = request.data;
    requireAuth(request);
    validatePaymentData(request.data);

    // Verify payment with gateway
    const isValid = verifyPaymentSignature(paymentId, orderId, signature);

    if (!isValid) {
      throw new Error("Payment verification failed");
    }

    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists) {
      throw new Error("Booking not found");
    }

    await bookingRef.update({
      status: "accepted",
      paymentStatus: "paid",
      transactionId: paymentId,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create notification for user
    await db.collection("userNotifications").add({
      userId: request.auth?.uid,
      message: "Your booking has been confirmed!",
      timestamp: FieldValue.serverTimestamp(),
      href: `/dashboard/bookings`,
      type: "booking_confirmed",
      seen: false,
    });

    return { success: true };
  } catch (error) {
    logger.error(`Error confirming booking:`, error);
    throw new Error(`Failed to confirm booking: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

// Update Booking Status (Admin Function)
export const updateBookingStatus = onCall({ 
  maxInstances: 10,
  memory: "256MiB",
  timeoutSeconds: 60
}, async (request) => {
  try {
    const { bookingId, status, meetingLink } = request.data;
    await requireAdmin(request, auth);

    if (!bookingId || typeof bookingId !== "string") {
      throw new Error("Invalid booking ID");
    }
    if (!status || typeof status !== "string") {
      throw new Error("Invalid status");
    }

    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      throw new Error("Booking not found");
    }

    const updateData: any = {
      status,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (meetingLink && typeof meetingLink === "string") {
      updateData.meetingLink = meetingLink;
    }

    await bookingRef.update(updateData);

    // Create notification for user
    const bookingData = bookingDoc.data();
    if (bookingData?.uid) {
      await db.collection("userNotifications").add({
        userId: bookingData.uid,
        message: `Your booking status has been updated to ${status}`,
        timestamp: FieldValue.serverTimestamp(),
        href: `/dashboard/bookings`,
        type: "booking_updated",
        seen: false,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error(`Error updating booking status:`, error);
    throw new Error(`Failed to update booking status: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

// Process Refund Request
export const processRefundRequest = onCall({ 
  maxInstances: 10,
  memory: "256MiB",
  timeoutSeconds: 60
}, async (request) => {
  try {
    const { bookingId, refundReason } = request.data;
    await requireAdmin(request, auth);

    if (!bookingId || typeof bookingId !== "string") {
      throw new Error("Invalid booking ID");
    }
    if (!refundReason || typeof refundReason !== "string") {
      throw new Error("Refund reason is required");
    }

    const bookingRef = db.collection("bookings").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      throw new Error("Booking not found");
    }

    const bookingData = bookingDoc.data();

    // Update booking with refund request
    await bookingRef.update({
      requestedRefund: true,
      refundReason,
      status: "refund_requested",
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Create notification for user
    if (bookingData?.uid) {
      await db.collection("userNotifications").add({
        userId: bookingData.uid,
        message: "Your refund request has been submitted and is under review.",
        timestamp: FieldValue.serverTimestamp(),
        href: `/dashboard/bookings`,
        type: "refund_requested",
        seen: false,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error(`Error processing refund request:`, error);
    throw new Error(`Failed to process refund request: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

// Export Reports (Admin Function)
export const exportBookingsReport = onCall({ 
  maxInstances: 5,
  memory: "512MiB",
  timeoutSeconds: 120
}, async (request) => {
  try {
    const { startDate, endDate, status } = request.data;
    await requireAdmin(request, auth);

    let bookingsQuery: any = db.collection("bookings");

    if (startDate && endDate) {
      bookingsQuery = bookingsQuery.where("date", ">=", startDate).where("date", "<=", endDate);
    }

    if (status) {
      bookingsQuery = bookingsQuery.where("status", "==", status);
    }

    // Add limit to prevent memory issues
    bookingsQuery = bookingsQuery.limit(1000);

    const snapshot = await bookingsQuery.get();
    const bookings = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      success: true,
      data: bookings,
      count: bookings.length,
    };
  } catch (error) {
    logger.error(`Error exporting bookings report:`, error);
    throw new Error(`Failed to export bookings report: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
});

// Auto-cancel unpaid bookings (Scheduled Function)
export const autoCancelUnpaidBookings = onRequest({ 
  memory: "256MiB",
  timeoutSeconds: 120
}, async (req, res) => {
  try {
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

    const snapshot = await db.collection("bookings")
      .where("status", "==", "pending_approval")
      .where("paymentStatus", "==", "pay_later_pending")
      .where("createdAt", "<", cutoffTime)
      .limit(100) // Process in batches
      .get();

    const batch = db.batch();
    let cancelledCount = 0;

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        status: "cancelled",
        paymentStatus: "pay_later_unpaid",
        updatedAt: FieldValue.serverTimestamp(),
      });
      cancelledCount++;
    });

    if (cancelledCount > 0) {
      await batch.commit();
    }

    logger.info(`Auto-cancelled ${cancelledCount} unpaid bookings`);
    res.json({ success: true, cancelledCount });
  } catch (error) {
    logger.error("Error in autoCancelUnpaidBookings:", error);
    res.status(500).json({ error: "Failed to auto-cancel bookings" });
  }
});

// Notification triggers
export const onBookingStatusChange = onDocumentUpdated("bookings/{bookingId}", async (event) => {
  if (!event.data || !event.data.before || !event.data.after) {
    logger.error("Missing event.data.before or event.data.after in onBookingStatusChange");
    return;
  }

  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  if (beforeData?.status !== afterData?.status) {
    try {
      if (afterData?.uid) {
        await db.collection("userNotifications").add({
          userId: afterData.uid,
          message: `Your booking status has changed from ${beforeData?.status} to ${afterData?.status}`,
          timestamp: FieldValue.serverTimestamp(),
          href: `/dashboard/bookings`,
          type: "booking_status_changed",
          seen: false,
        });
      }
    } catch (error) {
      logger.error("Error creating notification for booking status change:", error);
    }
  }
});

export const onNewMessage = onDocumentCreated("userMessages/{messageId}", async (event) => {
  if (!event.data) {
    logger.error("No event.data found in onNewMessage");
    return;
  }

  const messageData = event.data.data();
  if (messageData?.senderType === "user") {
    try {
      // Get admin users from a collection or use a predefined list
      const adminSnapshot = await db.collection("userProfiles")
        .where("role", "==", "admin")
        .limit(5)
        .get();

      const notificationPromises = adminSnapshot.docs.map(adminDoc => {
        return db.collection("userNotifications").add({
          userId: adminDoc.id,
          message: `New message from ${messageData.userName}: ${messageData.subject}`,
          timestamp: FieldValue.serverTimestamp(),
          href: `/admin/messages`,
          type: "new_message",
          seen: false,
        });
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      logger.error("Error creating notification for new message:", error);
    }
  }
});