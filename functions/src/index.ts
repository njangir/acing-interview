
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import crypto from "crypto";
import type { Booking, UserMessage, Service, Resource, Badge, UserProfile, MentorProfileData, Testimonial, FeedbackSubmissionHistoryEntry } from "./types";
import { getStorage } from "firebase-admin/storage";


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

  const newUserProfile: Omit<UserProfile, 'uid' | 'awardedBadges'> = {
    name: displayName || "New User",
    email: email || '',
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

exports.createPaymentOrder = functions.https.onCall(async (data: { amount: number; bookingId: string; }, context: functions.https.CallableContext) => {
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

exports.verifyPayment = functions.https.onCall(async (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; bookingId: string; }, context: functions.https.CallableContext) => {
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

exports.processRefund = functions.https.onCall(async (data: { bookingId: string }, context: functions.https.CallableContext) => {
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

exports.exportBookingsReport = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const bookingsSnap = await firestore.collection("bookings").get();
    const bookingsData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: bookingsData };
});

exports.exportUsersReport = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const usersSnap = await firestore.collection("userProfiles").get();
    const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    return { data: usersData };
});

exports.exportServicesReport = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const servicesSnap = await firestore.collection("services").get();
    const servicesData = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: servicesData };
});

exports.getAdminDashboardData = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    
    try {
        const bookingsQuery = firestore.collection('bookings');
        const servicesQuery = firestore.collection('services');
        const messagesQuery = firestore.collection('userMessages');

        const [bookingsSnapshot, servicesSnapshot, messagesSnapshot] = await Promise.all([
            bookingsQuery.get(),
            servicesQuery.get(),
            messagesQuery.get()
        ]);

        const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const services = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return { bookings, services, messages };

    } catch (error) {
        logger.error("Error fetching admin dashboard data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch dashboard data.");
    }
});
    

// New Admin Write Functions

// Services
exports.getServices = functions.https.onCall(async(data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const servicesSnap = await firestore.collection("services").orderBy('name', 'asc').get();
    const servicesData = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { services: servicesData };
});

exports.saveService = functions.https.onCall(async (data: { service: Service }, context: functions.https.CallableContext) => {
  await ensureAdmin(context);
  const { service } = data;
  const firestore = getFirestore();
  if (service.id) {
    const serviceRef = firestore.collection('services').doc(service.id);
    delete service.id;
    await serviceRef.update({ ...service, updatedAt: FieldValue.serverTimestamp() });
  } else {
    await firestore.collection('services').add({ ...service, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  }
  return { success: true };
});

exports.deleteService = functions.https.onCall(async (data: { serviceId: string }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { serviceId } = data;
    const firestore = getFirestore();
    await firestore.collection('services').doc(serviceId).delete();
    return { success: true };
});

exports.toggleServiceBookable = functions.https.onCall(async (data: { serviceId: string, isBookable: boolean }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { serviceId, isBookable } = data;
    const firestore = getFirestore();
    await firestore.collection('services').doc(serviceId).update({ isBookable, updatedAt: FieldValue.serverTimestamp() });
    return { success: true };
});

// Resources
exports.getResourcesAndServices = functions.https.onCall(async(data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const resourcesSnap = await firestore.collection("resources").orderBy('title', 'asc').get();
    const servicesSnap = await firestore.collection("services").orderBy('name', 'asc').get();
    const resourcesData = resourcesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const servicesData = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { resources: resourcesData, services: servicesData };
});

exports.saveResource = functions.https.onCall(async (data: { resource: Resource }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { resource } = data;
    const firestore = getFirestore();
    if (resource.id) {
        const resourceRef = firestore.collection('resources').doc(resource.id);
        delete resource.id;
        await resourceRef.update({ ...resource, updatedAt: FieldValue.serverTimestamp() });
    } else {
        await firestore.collection('resources').add({ ...resource, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }
    return { success: true };
});

exports.deleteResource = functions.https.onCall(async (data: { resourceId: string, resourceType: string, resourceUrl: string }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { resourceId, resourceType, resourceUrl } = data;
    const firestore = getFirestore();
    if (resourceType === 'document' && resourceUrl.includes('firebasestorage.googleapis.com')) {
        const storage = getStorage();
        try {
            const fileRef = storage.refFromURL(resourceUrl);
            await fileRef.delete();
        } catch (storageError) {
            logger.error(`Could not delete file ${resourceUrl} from storage, but proceeding with Firestore deletion.`, storageError);
        }
    }
    await firestore.collection('resources').doc(resourceId).delete();
    return { success: true };
});

// Badges
exports.getBadges = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const badgesSnap = await firestore.collection('badges').orderBy('name', 'asc').get();
    const badgesData = badgesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { badges: badgesData };
});

exports.saveBadge = functions.https.onCall(async (data: { badge: Badge }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { badge } = data;
    const firestore = getFirestore();
    if (badge.id) {
        const badgeRef = firestore.collection('badges').doc(badge.id);
        delete badge.id;
        await badgeRef.update({ ...badge, updatedAt: FieldValue.serverTimestamp() });
    } else {
        await firestore.collection('badges').add({ ...badge, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }
    return { success: true };
});

exports.deleteBadge = functions.https.onCall(async (data: { badgeId: string }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { badgeId } = data;
    const firestore = getFirestore();
    await firestore.collection('badges').doc(badgeId).delete();
    return { success: true };
});

// Availability
exports.getAvailability = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const snapshot = await firestore.collection('globalAvailability').get();
    const availabilityData: Record<string, string[]> = {};
    snapshot.forEach(doc => {
        availabilityData[doc.id] = doc.data().timeSlots || [];
    });
    return { availability: availabilityData };
});

exports.saveAvailability = functions.https.onCall(async (data: { updates: Record<string, string[]> }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { updates } = data;
    const firestore = getFirestore();
    const batch = firestore.batch();
    for (const dateString in updates) {
        const docRef = firestore.collection('globalAvailability').doc(dateString);
        batch.set(docRef, { timeSlots: updates[dateString] });
    }
    await batch.commit();
    return { success: true };
});


// Mentor Profile
exports.getMentorProfile = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const profileSnap = await firestore.collection('siteProfiles').doc('mainMentor').get();
    if (!profileSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mentor profile does not exist.');
    }
    return { profile: profileSnap.data() };
});

exports.saveMentorProfile = functions.https.onCall(async (data: { profile: MentorProfileData }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { profile } = data;
    const firestore = getFirestore();
    const profileRef = firestore.collection('siteProfiles').doc('mainMentor');
    await profileRef.set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true };
});


// Messages
exports.getMessages = functions.https.onCall(async (data, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const messagesSnap = await firestore.collection('userMessages').orderBy('timestamp', 'desc').get();
    const messagesData = messagesSnap.docs.map(doc => {
        const docData = doc.data();
        return {
            id: doc.id,
            ...docData,
            timestamp: (docData.timestamp as FirebaseFirestore.Timestamp).toDate().toISOString(),
            createdAt: (docData.createdAt as FirebaseFirestore.Timestamp).toDate().toISOString(),
            updatedAt: (docData.updatedAt as FirebaseFirestore.Timestamp).toDate().toISOString()
        };
    });
    return { messages: messagesData };
});

exports.sendAdminReply = functions.https.onCall(async (data: { userUid: string, userName: string, userEmail: string, subject: string, messageBody: string, adminName: string }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { userUid, userName, userEmail, subject, messageBody, adminName } = data;
    const firestore = getFirestore();
    const newAdminMessage: Omit<UserMessage, 'id'> = {
      uid: userUid,
      userName: userName,
      userEmail: userEmail,
      subject: `Re: ${subject}`,
      messageBody: messageBody,
      status: 'replied',
      senderType: 'admin',
      adminName: adminName,
      timestamp: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    await firestore.collection("userMessages").add(newAdminMessage);
    const userMessagesToUpdateQuery = firestore.collection("userMessages")
        .where("userEmail", "==", userEmail)
        .where("subject", "in", [subject, `Re: ${subject}`])
        .where("senderType", "==", "user")
        .where("status", "in", ["new", "read"]);
    const userMessagesSnapshot = await userMessagesToUpdateQuery.get();
    const batch = firestore.batch();
    userMessagesSnapshot.forEach(docToUpdate => {
        batch.update(docToUpdate.ref, { status: 'replied', updatedAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();
    return { success: true };
});

exports.markMessagesAsRead = functions.https.onCall(async (data: { messageIds: string[] }, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { messageIds } = data;
    if (!messageIds || !Array.isArray(messageIds)) {
        throw new functions.https.HttpsError('invalid-argument', 'messageIds must be an array.');
    }
    const firestore = getFirestore();
    const batch = firestore.batch();
    messageIds.forEach(id => {
        const msgRef = firestore.collection("userMessages").doc(id);
        batch.update(msgRef, { status: 'read', updatedAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();
    return { success: true };
});

// Add more admin write functions below as needed
