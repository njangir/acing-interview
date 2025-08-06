
import * as functions from "firebase-functions";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Razorpay from "razorpay";
import crypto from "crypto";
import type { Booking, UserMessage, Service, Resource, Badge, UserProfile, MentorProfileData, Testimonial, FeedbackSubmissionHistoryEntry, HeroSectionData, UserNotification, BlogPost } from "./types";
import { getStorage } from "firebase-admin/storage";

initializeApp();

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

exports.createPaymentOrder = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { amount, bookingId } = data as { amount: number; bookingId: string; };
  if (!amount || !bookingId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with 'amount' and 'bookingId' arguments."
    );
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
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
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (error) {
    logger.error("Error creating Razorpay order:", error);
    throw new functions.https.HttpsError("internal", "Could not create payment order.", error);
  }
});

exports.verifyPayment = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
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
  } = data as { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string; bookingId: string; };

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

  const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string);
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

exports.processRefund = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
  await ensureAdmin(context);
  const { bookingId } = data as { bookingId: string };
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
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
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
  const notificationData: Omit<UserNotification, 'id' | 'timestamp'> & { timestamp: FieldValue } = {
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

  if (before.status !== 'completed' && after.status === 'completed') {
    return createNotification(after.uid, `Feedback for '${serviceName}' is available.`, '/dashboard/bookings?tab=past');
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

exports.exportBookingsReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const bookingsSnap = await firestore.collection("bookings").get();
    const bookingsData = bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { data: bookingsData };
});

exports.exportUsersReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const usersSnap = await firestore.collection("userProfiles").get();
    const usersData = usersSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    return { data: usersData };
});

exports.exportServicesReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const servicesSnap = await firestore.collection("services").get();
    const servicesData = servicesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return { data: servicesData };
});

exports.getAdminDashboardData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
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

        const bookings = bookingsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
        const services = servicesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
        const messages = messagesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));

        return { bookings, services, messages };

    } catch (error) {
        logger.error("Error fetching admin dashboard data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch dashboard data.");
    }
});

exports.getAvailableSlots = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { dateString } = data;
    if (!dateString) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'dateString'.");
    }

    try {
        const firestore = getFirestore();
        
        // 1. Get all possible slots for the day from the already fetched global data
        const availabilityDocRef = firestore.collection('globalAvailability').doc(dateString);
        const availabilitySnap = await availabilityDocRef.get();
        const allPossibleSlotsForDay = availabilitySnap.exists ? availabilitySnap.data()?.timeSlots || [] : [];
        
        if (allPossibleSlotsForDay.length === 0) {
            return { availableSlots: [] };
        }

        // 2. Fetch only the BOOKED slots for this date from the backend
        const bookingsQuery = firestore.collection("bookings")
            .where("date", "==", dateString)
            .where("status", "in", ["pending_approval", "accepted", "scheduled"]);

        const bookingsSnapshot = await bookingsQuery.get();
        const bookedTimes = new Set(bookingsSnapshot.docs.map(doc => doc.data().time));

        // 3. Filter out the booked times
        const trulyAvailableSlots = allPossibleSlotsForDay.filter((time: string) => !bookedTimes.has(time));
        
        return { availableSlots: trulyAvailableSlots };

    } catch (err: any) {
        logger.error(`Error fetching available slots for ${dateString}:`, err);
        throw new functions.https.HttpsError("internal", "Could not retrieve available slots.", err.message);
    }
});
    

// New Admin Write Functions

// Services
exports.getServices = functions.https.onCall(async(data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const servicesSnap = await firestore.collection("services").orderBy('name', 'asc').get();
    const servicesData = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { services: servicesData };
});

exports.saveService = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  await ensureAdmin(context);
  const { service } = data as { service: Service };
  const firestore = getFirestore();
  
  // Sanitize data before saving
  const serviceToSave: Partial<Service> = {
    ...service,
    // Ensure detailSections is an array of objects with title and content
    detailSections: Array.isArray(service.detailSections) ? service.detailSections.map(s => {
        if (s.type === 'text') {
            return { type: 'text', title: s.title || "", content: s.content || "" };
        }
        if (s.type === 'image') {
            return { type: 'image', title: s.title || "", imageUrl: s.imageUrl || "", imageHint: s.imageHint || "" };
        }
        return s; // Should not happen with proper client-side validation
    }).filter(Boolean) : []
  };
  
  // Remove fields that are no longer part of the model to avoid polluting the DB
  delete (serviceToSave as any).howItWorks;
  delete (serviceToSave as any).whatToExpect;
  delete (serviceToSave as any).howItWillHelp;
  delete (serviceToSave as any).bannerImageUrl;
  delete (serviceToSave as any).bannerImageDataAiHint;

  if (serviceToSave.id) {
    const serviceRef = firestore.collection('services').doc(serviceToSave.id);
    const { id, ...serviceWithoutId } = serviceToSave;
    await serviceRef.update({ ...serviceWithoutId, updatedAt: FieldValue.serverTimestamp() });
  } else {
    const { id, ...serviceWithoutId } = serviceToSave;
    await firestore.collection('services').add({ ...serviceWithoutId, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  }
  return { success: true };
});

exports.deleteService = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { serviceId } = data as { serviceId: string };
    const firestore = getFirestore();
    await firestore.collection('services').doc(serviceId).delete();
    return { success: true };
});

exports.toggleServiceBookable = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { serviceId, isBookable } = data as { serviceId: string, isBookable: boolean };
    const firestore = getFirestore();
    await firestore.collection('services').doc(serviceId).update({ isBookable, updatedAt: FieldValue.serverTimestamp() });
    return { success: true };
});

// Resources
exports.getResourcesAndServices = functions.https.onCall(async(data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const resourcesSnap = await firestore.collection("resources").orderBy('title', 'asc').get();
    const servicesSnap = await firestore.collection("services").orderBy('name', 'asc').get();
    const resourcesData = resourcesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    const servicesData = servicesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return { resources: resourcesData, services: servicesData };
});

exports.saveResource = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { resource } = data as { resource: Resource };
    const firestore = getFirestore();
    if (resource.id) {
        const resourceRef = firestore.collection('resources').doc(resource.id);
        const { id, ...resourceWithoutId } = resource;
        await resourceRef.update({ ...resourceWithoutId, updatedAt: FieldValue.serverTimestamp() });
    } else {
        await firestore.collection('resources').add({ ...resource, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }
    return { success: true };
});

exports.deleteResource = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { resourceId, resourceType, resourceUrl } = data as { resourceId: string, resourceType: string, resourceUrl: string };
    const firestore = getFirestore();
    if (resourceType === 'document' && resourceUrl.includes('firebasestorage.googleapis.com')) {
        const storage = getStorage();
        try {
            // Extract the file path from the URL
            const url = new URL(resourceUrl);
            const pathMatch = url.pathname.match(/\/b\/[^\/]+\/o\/(.+)$/);
            if (pathMatch) {
                const filePath = decodeURIComponent(pathMatch[1]);
                const bucket = storage.bucket();
                const file = bucket.file(filePath);
                await file.delete();
                logger.info(`Successfully deleted file from storage: ${filePath}`);
            } else {
                logger.warn(`Could not extract file path from URL: ${resourceUrl}`);
            }
        } catch (storageError) {
            logger.error(`Could not delete file ${resourceUrl} from storage, but proceeding with Firestore deletion.`, storageError);
        }
    }
    await firestore.collection('resources').doc(resourceId).delete();
    return { success: true };
});

// Badges
exports.getBadges = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const badgesSnap = await firestore.collection('badges').orderBy('name', 'asc').get();
    const badgesData = badgesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() }));
    return { badges: badgesData };
});

exports.saveBadge = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { badge } = data as { badge: Badge };
    const firestore = getFirestore();
    if (badge.id) {
        const badgeRef = firestore.collection('badges').doc(badge.id);
        const { id, ...badgeWithoutId } = badge;
        await badgeRef.update({ ...badgeWithoutId, updatedAt: FieldValue.serverTimestamp() });
    } else {
        const { id, ...badgeWithoutId } = badge;
        await firestore.collection('badges').add({ ...badgeWithoutId, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    }
    return { success: true };
});

exports.deleteBadge = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { badgeId } = data as { badgeId: string };
    const firestore = getFirestore();
    await firestore.collection('badges').doc(badgeId).delete();
    return { success: true };
});

// Availability
exports.getAvailability = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // This function can be called by any authenticated user to check which dates have slots.
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const firestore = getFirestore();
    const snapshot = await firestore.collection('globalAvailability').get();
    const availabilityData: Record<string, string[]> = {};
    snapshot.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        availabilityData[doc.id] = doc.data().timeSlots || [];
    });
    return { availability: availabilityData };
});

exports.saveAvailability = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { updates } = data as { updates: Record<string, string[]> };
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
exports.getMentorProfile = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const profileSnap = await firestore.collection('siteProfiles').doc('mainMentor').get();
    if (!profileSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mentor profile does not exist.');
    }
    return { profile: profileSnap.data() };
});

exports.saveMentorProfile = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { profile } = data as { profile: MentorProfileData };
    const firestore = getFirestore();
    const profileRef = firestore.collection('siteProfiles').doc('mainMentor');
    await profileRef.set({ ...profile, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { success: true };
});

// Messages
exports.getMessages = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const messagesSnap = await firestore.collection('userMessages').orderBy('timestamp', 'desc').get();
    const messagesData = messagesSnap.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
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

exports.sendAdminReply = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { userUid, userName, userEmail, subject, messageBody, adminName } = data as { userUid: string, userName: string, userEmail: string, subject: string, messageBody: string, adminName: string };
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
    userMessagesSnapshot.forEach((docToUpdate: FirebaseFirestore.QueryDocumentSnapshot) => {
        batch.update(docToUpdate.ref, { status: 'replied', updatedAt: FieldValue.serverTimestamp() });
    });
    await batch.commit();
    return { success: true };
});

exports.markMessagesAsRead = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { messageIds } = data as { messageIds: string[] };
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

exports.toggleMessageThreadStatus = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { userEmail, subject, status } = data as { userEmail: string, subject: string, status: 'closed' | 'replied' };

    if (!userEmail || !subject || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments: userEmail, subject, status.');
    }

    const firestore = getFirestore();
    const messagesQuery = firestore.collection("userMessages")
        .where("userEmail", "==", userEmail)
        .where("subject", "in", [subject, `Re: ${subject}`]);

    const messagesSnapshot = await messagesQuery.get();

    if (messagesSnapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'No messages found for this conversation thread.');
    }

    const batch = firestore.batch();
    messagesSnapshot.forEach(doc => {
        batch.update(doc.ref, { status: status, updatedAt: FieldValue.serverTimestamp() });
    });

    await batch.commit();
    return { success: true, message: `Conversation thread has been ${status}.` };
});


exports.uploadReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { bookingId, fileName, fileDataUrl } = data as { bookingId: string, fileName: string, fileDataUrl: string };

    if (!bookingId || !fileName || !fileDataUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required data for file upload.');
    }

    const storage = getStorage();
    const bucket = storage.bucket();

    const match = fileDataUrl.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid data URL format.');
    }
    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    // Determine folder based on a prefix in bookingId, or default to feedback_reports
    const folder = bookingId.startsWith('services_thumbnails') ? 'services/thumbnails' :
                   bookingId.startsWith('services_banners') ? 'services/banners' :
                   bookingId.startsWith('site_content_') ? 'site_content' : 
                   bookingId.startsWith('blog_') ? 'blog' :
                   'feedback_reports';
    const filePath = `${folder}/${bookingId}_${Date.now()}_${sanitizedFileName}`;
    const file = bucket.file(filePath);

    try {
        await file.save(buffer, {
            metadata: { 
                contentType,
                cacheControl: 'public, max-age=31536000',
            },
            public: true, 
        });
        
        // This is the correct public URL format for Next/Image whitelisting.
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media`;
        
        logger.info(`File uploaded successfully for booking ${bookingId}: ${downloadUrl}`);
        return { success: true, downloadUrl: downloadUrl };
    } catch (error) {
        logger.error(`File upload failed for booking ${bookingId}:`, error);
        throw new functions.https.HttpsError('internal', 'Failed to upload file to storage.');
    }
});

exports.getAdminBookingsPageData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    try {
        const servicesQuery = firestore.collection('services').orderBy('name', 'asc');
        const bookingsQuery = firestore.collection('bookings').orderBy('date', 'desc');
        const usersQuery = firestore.collection('userProfiles').orderBy('name', 'asc');

        const [servicesSnapshot, bookingsSnapshot, usersSnapshot] = await Promise.all([
            servicesQuery.get(),
            bookingsQuery.get(),
            usersQuery.get(),
        ]);

        const services = servicesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Service));
        const bookings = bookingsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Booking));
        const users = usersSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ uid: doc.id, ...doc.data() } as UserProfile));
        
        return { services, bookings, users };
    } catch (error) {
        logger.error("Error fetching admin bookings page data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch admin bookings page data.");
    }
});

exports.getAdminReportsPageData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    logger.info("getAdminReportsPageData: Admin confirmed. Fetching data...");
    const firestore = getFirestore();
    try {
        logger.info("Querying for completed bookings...");
        const bookingsQuery = firestore.collection("bookings").where("status", "==", "completed").orderBy("createdAt", "desc");
        
        logger.info("Querying for badges...");
        const badgesQuery = firestore.collection("badges");

        logger.info("Querying for submission history...");
        const historyQuery = firestore.collection("feedbackSubmissions").orderBy("createdAt", "desc");

        const [bookingsSnapshot, badgesSnapshot, historySnapshot] = await Promise.all([
            bookingsQuery.get(),
            badgesQuery.get(),
            historyQuery.get()
        ]);
        logger.info(`Fetched ${bookingsSnapshot.docs.length} completed bookings.`);
        logger.info(`Fetched ${badgesSnapshot.docs.length} badges.`);
        logger.info(`Fetched ${historySnapshot.docs.length} history entries.`);

        const completedBookings = bookingsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Booking));
        const badges = badgesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Badge));
        const history = historySnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as FeedbackSubmissionHistoryEntry));

        logger.info("Data processing complete. Returning data to client.");
        return { completedBookings, badges, history };
    } catch (error) {
        logger.error("Error fetching admin reports page data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch admin reports page data.");
    }
});

exports.getAdminTestimonialsPageData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    try {
        const testimonialsQuery = firestore.collection('testimonials').orderBy('createdAt', 'desc');
        const servicesQuery = firestore.collection('services').orderBy('name', 'asc');
        const bookingsQuery = firestore.collection('bookings');

        const [testimonialsSnapshot, servicesSnapshot, bookingsSnapshot] = await Promise.all([
            testimonialsQuery.get(),
            servicesQuery.get(),
            bookingsQuery.get(),
        ]);

        const testimonials = testimonialsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Testimonial));
        const services = servicesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Service));
        const bookings = bookingsSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as Booking));
        
        return { testimonials, services, bookings };
    } catch (error) {
        logger.error("Error fetching admin testimonials page data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch admin testimonials page data.");
    }
});

// New function to save hero section data
exports.saveHeroSection = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    // The data is now nested under `heroData` key from the client call.
    const heroData = data.heroData as HeroSectionData;
    
    if (!heroData) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing heroData payload.');
    }
    
    const firestore = getFirestore();
    const heroDocRef = firestore.collection('siteContent').doc('homePage');
    
    try {
        await heroDocRef.set({
            ...heroData,
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });
        logger.info("Hero section data successfully saved for user:", context.auth?.uid);
        return { success: true, message: "Hero section updated successfully." };
    } catch (error) {
        logger.error("Error saving hero section data:", error);
        throw new functions.https.HttpsError('internal', 'Failed to save hero section data.');
    }
});

// Upload file to Firebase Storage
exports.uploadFile = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { fileName, fileDataUrl, folder = 'uploads' } = data as { 
        fileName: string; 
        fileDataUrl: string; 
        folder?: string; 
    };

    if (!fileName || !fileDataUrl) {
        throw new functions.https.HttpsError("invalid-argument", "fileName and fileDataUrl are required.");
    }

    try {
        // Extract base64 data from data URL
        const base64Data = fileDataUrl.split(',')[1];
        if (!base64Data) {
            throw new functions.https.HttpsError("invalid-argument", "Invalid file data URL format.");
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const storage = getStorage();
        const bucket = storage.bucket();
        
        // Generate unique filename
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${folder}/${timestamp}_${sanitizedFileName}`;
        
        const file = bucket.file(uniqueFileName);
        
        // Upload the file
        await file.save(buffer, {
            metadata: {
                contentType: getContentType(fileName),
            },
        });

        // Make the file publicly accessible
        await file.makePublic();

        // Return the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
        
        logger.info(`File uploaded successfully: ${publicUrl}`);
        return { downloadURL: publicUrl };
        
    } catch (error) {
        logger.error("Error uploading file:", error);
        throw new functions.https.HttpsError("internal", "Failed to upload file.");
    }
});

// Helper function to determine content type
function getContentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'png':
            return 'image/png';
        case 'gif':
            return 'image/gif';
        case 'webp':
            return 'image/webp';
        case 'pdf':
            return 'application/pdf';
        default:
            return 'application/octet-stream';
    }
}


// Blog Post Functions
exports.getBlogPosts = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const firestore = getFirestore();
    const postsSnap = await firestore.collection("blogPosts").orderBy('publicationDate', 'desc').get();
    const postsData = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { posts: postsData };
});

exports.saveBlogPost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { post } = data as { post: BlogPost };
    const firestore = getFirestore();
    
    if (post.id) {
        const postRef = firestore.collection('blogPosts').doc(post.id);
        const { id, ...postWithoutId } = post;
        await postRef.update({ ...postWithoutId, updatedAt: FieldValue.serverTimestamp() });
    } else {
        const { id, ...postWithoutId } = post;
        await firestore.collection('blogPosts').add({
            ...postWithoutId,
            publicationDate: FieldValue.serverTimestamp(),
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        });
    }
    return { success: true };
});

exports.deleteBlogPost = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    await ensureAdmin(context);
    const { postId } = data as { postId: string };
    const firestore = getFirestore();
    await firestore.collection('blogPosts').doc(postId).delete();
    return { success: true };
});

// Add more admin write functions below as needed
