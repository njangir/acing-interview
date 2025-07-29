
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import crypto from "crypto";
import type { Booking, UserMessage } from "./types";

initializeApp();

const RAZORPAY_KEY_ID = functions.config().razorpay.key_id;
const RAZORPAY_KEY_SECRET = functions.config().razorpay.key_secret;

// Helper function to check for admin role
const ensureAdmin = async (context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const uid = context.auth.uid;
    const firestore = getFirestore();
    const userProfileDoc = await firestore.collection("userProfiles").doc(uid).get();
    if (!userProfileDoc.exists) {
        throw new functions.https.HttpsError("permission-denied", "User profile not found.");
    }
    const roles = userProfileDoc.data()?.roles || [];
    if (!roles.includes("admin")) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to perform this action.");
    }
};

// This function triggers whenever a new user is created in Firebase Auth.
exports.oncreateuser = functions.auth.user().onCreate(async (user) => {
  logger.info("New user created:", user.uid);

  const { uid, email, displayName, photoURL } = user;
  const firestore = getFirestore();
  const awardedBadgeIds: string[] = [];

  try {
    const defaultBadgeRef = firestore.collection("badges").doc("commendable_effort");
    const defaultBadgeSnap = await defaultBadgeRef.get();
    if (defaultBadgeSnap.exists) {
      awardedBadgeIds.push(defaultBadgeSnap.id);
      logger.info(`Found default badge 'commendable_effort' for user: ${uid}`);
    } else {
        logger.warn(`Default badge with ID 'commendable_effort' not found in Firestore. Skipping default badge award for user: ${uid}`);
    }
  } catch (badgeError) {
      logger.error(`Error fetching default badge for user ${uid}:`, badgeError);
  }

  const newUserProfile = {
    name: displayName || "New User",
    email: email,
    phone: "", 
    imageUrl: photoURL || "",
    roles: ["user"],
    awardedBadgeIds: awardedBadgeIds,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    await firestore.collection("userProfiles").doc(uid).set(newUserProfile);
    logger.info(`Successfully created profile for user: ${uid}`);
    return;
  } catch (error) {
    logger.error(`Error creating profile for user: ${uid}`, error);
    return;
  }
});

exports.createPaymentOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { amount, bookingId } = data;
  if (!amount || !bookingId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with 'amount' and 'bookingId' arguments."
    );
  }

  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });

  const options = {
    amount: amount * 100, // Amount in paise
    currency: "INR",
    receipt: `receipt_booking_${bookingId}`,
    notes: {
      bookingId: bookingId,
      userId: context.auth.uid,
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    logger.info("Razorpay order created:", { orderId: order.id, bookingId });
    return {
      orderId: order.id,
      keyId: RAZORPAY_KEY_ID,
    };
  } catch (error) {
    logger.error("Error creating Razorpay order:", error);
    throw new functions.https.HttpsError("internal", "Could not create payment order.", error);
  }
});

exports.verifyPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
  } = data;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !bookingId
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required payment verification details."
    );
  }

  const shasum = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET);
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    logger.warn("Transaction tampering detected", { bookingId });
    throw new functions.https.HttpsError("permission-denied", "Payment verification failed.");
  }

  try {
    const firestore = getFirestore();
    const bookingDocRef = firestore.collection("bookings").doc(bookingId);

    await bookingDocRef.update({
      paymentStatus: "paid",
      status: "accepted",
      transactionId: razorpay_payment_id,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info("Booking confirmed and updated successfully", {
      bookingId,
      paymentId: razorpay_payment_id,
    });
    return { success: true, message: "Booking confirmed successfully" };
  } catch (error) {
    logger.error("Error updating booking after payment verification:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Payment verified, but failed to update booking."
    );
  }
});

exports.processRefund = functions.https.onCall(async (data, context) => {
  await ensureAdmin(context);
  const { bookingId } = data;
  if (!bookingId) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'bookingId'.");
  }

  const firestore = getFirestore();
  const bookingDocRef = firestore.collection("bookings").doc(bookingId);
  const bookingSnap = await bookingDocRef.get();

  if (!bookingSnap.exists) {
    throw new functions.https.HttpsError("not-found", `Booking with ID ${bookingId} not found.`);
  }

  const booking = bookingSnap.data() as Booking;
  if (booking.paymentStatus !== 'paid' || !booking.transactionId) {
    throw new functions.https.HttpsError("failed-precondition", "Booking is not in a refundable state (not paid or no transaction ID).");
  }

  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });

  try {
    logger.info(`Attempting to refund Razorpay payment: ${booking.transactionId}`);
    await razorpay.payments.refund(booking.transactionId, {});
    logger.info(`Successfully processed refund for payment: ${booking.transactionId}`);

    await bookingDocRef.update({
      status: 'cancelled',
      paymentStatus: 'pay_later_unpaid',
      requestedRefund: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Booking ${bookingId} successfully updated to cancelled/refunded state.`);
    return { success: true, message: "Refund processed and booking cancelled." };
  } catch (error: any) {
    logger.error(`Error processing refund for booking ${bookingId} with payment ${booking.transactionId}:`, error);
    
    const errorMessage = error.error?.description || "An internal error occurred with the payment provider.";
    
    throw new functions.https.HttpsError("internal", errorMessage, error);
  }
});

const createNotification = async (userId: string, message: string, href: string) => {
  if (!userId) return;
  const firestore = getFirestore();
  const notificationData = {
    userId,
    message,
    href,
    seen: false,
    timestamp: FieldValue.serverTimestamp(),
    type: 'booking_update',
  };
  try {
    await firestore.collection(`userProfiles/${userId}/notifications`).add(notificationData);
    logger.info(`Notification created for user ${userId}:`, message);
  } catch (e) {
    logger.error(`Failed to create notification for user ${userId}:`, e);
  }
};

exports.onBookingUpdate = functions.firestore.document("bookings/{bookingId}").onUpdate(async (change) => {
  const before = change.before.data() as Booking;
  const after = change.after.data() as Booking;

  const serviceName = after.serviceName.length > 20 ? `${after.serviceName.substring(0, 17)}...` : after.serviceName;

  if (before.status !== 'scheduled' && after.status === 'scheduled' && after.meetingLink) {
    return createNotification(after.uid, `Session for '${serviceName}' is scheduled.`, '/dashboard/bookings');
  }

  if (before.status !== 'cancelled' && after.status === 'cancelled') {
    return createNotification(after.uid, `Session for '${serviceName}' was cancelled.`, '/dashboard/bookings');
  }

  if (!before.reportUrl && after.reportUrl) {
    return createNotification(after.uid, `Feedback report for '${serviceName}' is now available.`, '/dashboard/bookings');
  }
  return null;
});

exports.onAdminMessage = functions.firestore.document("userMessages/{messageId}").onCreate(async (snap) => {
  const message = snap.data() as UserMessage;

  if (message.senderType === 'admin') {
    const subjectSnippet = message.subject.replace("Re: ", "").substring(0, 25);
    return createNotification(
      message.uid,
      `Admin replied in: "${subjectSnippet}${subjectSnippet.length === 25 ? "..." : ""}"`,
      '/dashboard/contact'
    );
  }
  return null;
});

exports.exportBookingsReport = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const bookingsSnap = await firestore.collection("bookings").get();
    const bookingsData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: bookingsData };
});

exports.exportUsersReport = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const usersSnap = await firestore.collection("userProfiles").get();
    const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    return { data: usersData };
});

exports.exportServicesReport = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const servicesSnap = await firestore.collection("services").get();
    const servicesData = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: servicesData };
});

    