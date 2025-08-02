"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = __importStar(require("firebase-functions"));
const logger = __importStar(require("firebase-functions/logger"));
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const storage_1 = require("firebase-admin/storage");
(0, app_1.initializeApp)();
// Helper function to check for admin role
const ensureAdmin = async (context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const uid = context.auth.uid;
    const firestore = (0, firestore_1.getFirestore)();
    const userProfileDoc = await firestore.collection("userProfiles").doc(uid).get();
    if (!userProfileDoc.exists) {
        throw new functions.https.HttpsError("permission-denied", "User profile not found.");
    }
    const roles = ((_a = userProfileDoc.data()) === null || _a === void 0 ? void 0 : _a.roles) || [];
    if (!roles.includes("admin")) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to perform this action.");
    }
};
// This function triggers whenever a new user is created in Firebase Auth.
exports.oncreateuser = functions.auth.user().onCreate(async (user) => {
    logger.info("New user created:", user.uid);
    const { uid, email, displayName, photoURL } = user;
    const firestore = (0, firestore_1.getFirestore)();
    const awardedBadgeIds = [];
    try {
        const defaultBadgeRef = firestore.collection("badges").doc("commendable_effort");
        const defaultBadgeSnap = await defaultBadgeRef.get();
        if (defaultBadgeSnap.exists) {
            awardedBadgeIds.push(defaultBadgeSnap.id);
            logger.info(`Found default badge 'commendable_effort' for user: ${uid}`);
        }
        else {
            logger.warn(`Default badge with ID 'commendable_effort' not found in Firestore. Skipping default badge award for user: ${uid}`);
        }
    }
    catch (badgeError) {
        logger.error(`Error fetching default badge for user ${uid}:`, badgeError);
    }
    const newUserProfile = {
        name: displayName || "New User",
        email: email || '',
        phone: "",
        imageUrl: photoURL || "",
        roles: ["user"],
        awardedBadgeIds: awardedBadgeIds,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    };
    try {
        await firestore.collection("userProfiles").doc(uid).set(newUserProfile);
        logger.info(`Successfully created profile for user: ${uid}`);
        return;
    }
    catch (error) {
        logger.error(`Error creating profile for user: ${uid}`, error);
        return;
    }
});
exports.createPaymentOrder = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { amount, bookingId } = data;
    if (!amount || !bookingId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with 'amount' and 'bookingId' arguments.");
    }
    const razorpay = new razorpay_1.default({
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
    }
    catch (error) {
        logger.error("Error creating Razorpay order:", error);
        throw new functions.https.HttpsError("internal", "Could not create payment order.", error);
    }
});
exports.verifyPayment = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, } = data;
    if (!razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !bookingId) {
        throw new functions.https.HttpsError("invalid-argument", "Missing required payment verification details.");
    }
    const shasum = crypto_1.default.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");
    if (digest !== razorpay_signature) {
        logger.warn("Transaction tampering detected", { bookingId });
        throw new functions.https.HttpsError("permission-denied", "Payment verification failed.");
    }
    try {
        const firestore = (0, firestore_1.getFirestore)();
        const bookingDocRef = firestore.collection("bookings").doc(bookingId);
        await bookingDocRef.update({
            paymentStatus: "paid",
            status: "accepted",
            transactionId: razorpay_payment_id,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        logger.info("Booking confirmed and updated successfully", {
            bookingId,
            paymentId: razorpay_payment_id,
        });
        return { success: true, message: "Booking confirmed successfully" };
    }
    catch (error) {
        logger.error("Error updating booking after payment verification:", error);
        throw new functions.https.HttpsError("internal", "Payment verified, but failed to update booking.");
    }
});
exports.processRefund = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    var _a;
    await ensureAdmin(context);
    const { bookingId } = data;
    if (!bookingId) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'bookingId'.");
    }
    const firestore = (0, firestore_1.getFirestore)();
    const bookingDocRef = firestore.collection("bookings").doc(bookingId);
    const bookingSnap = await bookingDocRef.get();
    if (!bookingSnap.exists) {
        throw new functions.https.HttpsError("not-found", `Booking with ID ${bookingId} not found.`);
    }
    const booking = bookingSnap.data();
    if (booking.paymentStatus !== 'paid' || !booking.transactionId) {
        throw new functions.https.HttpsError("failed-precondition", "Booking is not in a refundable state (not paid or no transaction ID).");
    }
    const razorpay = new razorpay_1.default({
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
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        logger.info(`Booking ${bookingId} successfully updated to cancelled/refunded state.`);
        return { success: true, message: "Refund processed and booking cancelled." };
    }
    catch (error) {
        logger.error(`Error processing refund for booking ${bookingId} with payment ${booking.transactionId}:`, error);
        const errorMessage = ((_a = error.error) === null || _a === void 0 ? void 0 : _a.description) || "An internal error occurred with the payment provider.";
        throw new functions.https.HttpsError("internal", errorMessage, error);
    }
});
const createNotification = async (userId, message, href) => {
    if (!userId)
        return;
    const firestore = (0, firestore_1.getFirestore)();
    const notificationData = {
        userId,
        message,
        href,
        seen: false,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        type: 'booking_update',
    };
    try {
        await firestore.collection(`userProfiles/${userId}/notifications`).add(notificationData);
        logger.info(`Notification created for user ${userId}:`, message);
    }
    catch (e) {
        logger.error(`Failed to create notification for user ${userId}:`, e);
    }
};
exports.onBookingUpdate = functions.firestore.document("bookings/{bookingId}").onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();
    const serviceName = after.serviceName.length > 20 ? `${after.serviceName.substring(0, 17)}...` : after.serviceName;
    if (before.status !== 'scheduled' && after.status === 'scheduled' && after.meetingLink) {
        return createNotification(after.uid, `Session for '${serviceName}' is scheduled.`, '/dashboard/bookings');
    }
    if (before.status !== 'cancelled' && after.status === 'cancelled') {
        return createNotification(after.uid, `Session for '${serviceName}' was cancelled.`, '/dashboard/bookings');
    }
    if (before.status !== 'completed' && after.status === 'completed') {
        return createNotification(after.uid, `Feedback for '${serviceName}' is available.`, '/dashboard/bookings');
    }
    if (!before.reportUrl && after.reportUrl) {
        return createNotification(after.uid, `Feedback report for '${serviceName}' is now available.`, '/dashboard/bookings');
    }
    return null;
});
exports.onAdminMessage = functions.firestore.document("userMessages/{messageId}").onCreate(async (snap) => {
    const message = snap.data();
    if (message.senderType === 'admin') {
        const subjectSnippet = message.subject.replace("Re: ", "").substring(0, 25);
        return createNotification(message.uid, `Admin replied in: "${subjectSnippet}${subjectSnippet.length === 25 ? "..." : ""}"`, '/dashboard/contact');
    }
    return null;
});
exports.exportBookingsReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const bookingsSnap = await firestore.collection("bookings").get();
    const bookingsData = bookingsSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return { data: bookingsData };
});
exports.exportUsersReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const usersSnap = await firestore.collection("userProfiles").get();
    const usersData = usersSnap.docs.map(doc => (Object.assign({ uid: doc.id }, doc.data())));
    return { data: usersData };
});
exports.exportServicesReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const servicesSnap = await firestore.collection("services").get();
    const servicesData = servicesSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { data: servicesData };
});
exports.getAdminDashboardData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    try {
        const bookingsQuery = firestore.collection('bookings');
        const servicesQuery = firestore.collection('services');
        const messagesQuery = firestore.collection('userMessages');
        const [bookingsSnapshot, servicesSnapshot, messagesSnapshot] = await Promise.all([
            bookingsQuery.get(),
            servicesQuery.get(),
            messagesQuery.get()
        ]);
        const bookings = bookingsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const services = servicesSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const messages = messagesSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        return { bookings, services, messages };
    }
    catch (error) {
        logger.error("Error fetching admin dashboard data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch dashboard data.");
    }
});
exports.getAvailableSlots = functions.https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { dateString } = data;
    if (!dateString) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'dateString'.");
    }
    try {
        const firestore = (0, firestore_1.getFirestore)();
        // Get all potentially available slots for the day from admin settings
        const availabilityDoc = await firestore.collection('globalAvailability').doc(dateString).get();
        const allPossibleSlots = availabilityDoc.exists ? ((_a = availabilityDoc.data()) === null || _a === void 0 ? void 0 : _a.timeSlots) || [] : [];
        if (allPossibleSlots.length === 0) {
            return { availableSlots: [] };
        }
        // Query for bookings on the selected date that are not cancelled
        const bookingsQuery = firestore.collection("bookings")
            .where("date", "==", dateString)
            .where("status", "!=", "cancelled");
        const bookingsSnapshot = await bookingsQuery.get();
        const bookedTimes = new Set(bookingsSnapshot.docs.map(doc => doc.data().time));
        // Filter out the booked times from the available slots
        const trulyAvailableSlots = allPossibleSlots.filter((time) => !bookedTimes.has(time));
        return { availableSlots: trulyAvailableSlots };
    }
    catch (err) {
        logger.error("Error fetching available slots:", err);
        throw new functions.https.HttpsError("internal", "Could not retrieve available slots.", err.message);
    }
});
// New Admin Write Functions
// Services
exports.getServices = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const servicesSnap = await firestore.collection("services").orderBy('name', 'asc').get();
    const servicesData = servicesSnap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return { services: servicesData };
});
exports.saveService = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { service } = data;
    const firestore = (0, firestore_1.getFirestore)();
    if (service.id) {
        const serviceRef = firestore.collection('services').doc(service.id);
        const { id } = service, serviceWithoutId = __rest(service, ["id"]);
        await serviceRef.update(Object.assign(Object.assign({}, serviceWithoutId), { updatedAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    else {
        await firestore.collection('services').add(Object.assign(Object.assign({}, service), { createdAt: firestore_1.FieldValue.serverTimestamp(), updatedAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    return { success: true };
});
exports.deleteService = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { serviceId } = data;
    const firestore = (0, firestore_1.getFirestore)();
    await firestore.collection('services').doc(serviceId).delete();
    return { success: true };
});
exports.toggleServiceBookable = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { serviceId, isBookable } = data;
    const firestore = (0, firestore_1.getFirestore)();
    await firestore.collection('services').doc(serviceId).update({ isBookable, updatedAt: firestore_1.FieldValue.serverTimestamp() });
    return { success: true };
});
// Resources
exports.getResourcesAndServices = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const resourcesSnap = await firestore.collection("resources").orderBy('title', 'asc').get();
    const servicesSnap = await firestore.collection("services").orderBy('name', 'asc').get();
    const resourcesData = resourcesSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    const servicesData = servicesSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { resources: resourcesData, services: servicesData };
});
exports.saveResource = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { resource } = data;
    const firestore = (0, firestore_1.getFirestore)();
    if (resource.id) {
        const resourceRef = firestore.collection('resources').doc(resource.id);
        const { id } = resource, resourceWithoutId = __rest(resource, ["id"]);
        await resourceRef.update(Object.assign(Object.assign({}, resourceWithoutId), { updatedAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    else {
        await firestore.collection('resources').add(Object.assign(Object.assign({}, resource), { createdAt: firestore_1.FieldValue.serverTimestamp(), updatedAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    return { success: true };
});
exports.deleteResource = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { resourceId, resourceType, resourceUrl } = data;
    const firestore = (0, firestore_1.getFirestore)();
    if (resourceType === 'document' && resourceUrl.includes('firebasestorage.googleapis.com')) {
        const storage = (0, storage_1.getStorage)();
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
            }
            else {
                logger.warn(`Could not extract file path from URL: ${resourceUrl}`);
            }
        }
        catch (storageError) {
            logger.error(`Could not delete file ${resourceUrl} from storage, but proceeding with Firestore deletion.`, storageError);
        }
    }
    await firestore.collection('resources').doc(resourceId).delete();
    return { success: true };
});
// Badges
exports.getBadges = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const badgesSnap = await firestore.collection('badges').orderBy('name', 'asc').get();
    const badgesData = badgesSnap.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
    return { badges: badgesData };
});
exports.saveBadge = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { badge } = data;
    const firestore = (0, firestore_1.getFirestore)();
    if (badge.id) {
        const badgeRef = firestore.collection('badges').doc(badge.id);
        const { id } = badge, badgeWithoutId = __rest(badge, ["id"]);
        await badgeRef.update(Object.assign(Object.assign({}, badgeWithoutId), { updatedAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    else {
        await firestore.collection('badges').add(Object.assign(Object.assign({}, badge), { createdAt: firestore_1.FieldValue.serverTimestamp(), updatedAt: firestore_1.FieldValue.serverTimestamp() }));
    }
    return { success: true };
});
exports.deleteBadge = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { badgeId } = data;
    const firestore = (0, firestore_1.getFirestore)();
    await firestore.collection('badges').doc(badgeId).delete();
    return { success: true };
});
// Availability
exports.getAvailability = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const snapshot = await firestore.collection('globalAvailability').get();
    const availabilityData = {};
    snapshot.forEach((doc) => {
        availabilityData[doc.id] = doc.data().timeSlots || [];
    });
    return { availability: availabilityData };
});
exports.saveAvailability = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { updates } = data;
    const firestore = (0, firestore_1.getFirestore)();
    const batch = firestore.batch();
    for (const dateString in updates) {
        const docRef = firestore.collection('globalAvailability').doc(dateString);
        batch.set(docRef, { timeSlots: updates[dateString] });
    }
    await batch.commit();
    return { success: true };
});
// Mentor Profile
exports.getMentorProfile = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const profileSnap = await firestore.collection('siteProfiles').doc('mainMentor').get();
    if (!profileSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Mentor profile does not exist.');
    }
    return { profile: profileSnap.data() };
});
exports.saveMentorProfile = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { profile } = data;
    const firestore = (0, firestore_1.getFirestore)();
    const profileRef = firestore.collection('siteProfiles').doc('mainMentor');
    await profileRef.set(Object.assign(Object.assign({}, profile), { updatedAt: firestore_1.FieldValue.serverTimestamp() }), { merge: true });
    return { success: true };
});
// Messages
exports.getMessages = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    const messagesSnap = await firestore.collection('userMessages').orderBy('timestamp', 'desc').get();
    const messagesData = messagesSnap.docs.map((doc) => {
        const docData = doc.data();
        return Object.assign(Object.assign({ id: doc.id }, docData), { timestamp: docData.timestamp.toDate().toISOString(), createdAt: docData.createdAt.toDate().toISOString(), updatedAt: docData.updatedAt.toDate().toISOString() });
    });
    return { messages: messagesData };
});
exports.sendAdminReply = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { userUid, userName, userEmail, subject, messageBody, adminName } = data;
    const firestore = (0, firestore_1.getFirestore)();
    const newAdminMessage = {
        uid: userUid,
        userName: userName,
        userEmail: userEmail,
        subject: `Re: ${subject}`,
        messageBody: messageBody,
        status: 'replied',
        senderType: 'admin',
        adminName: adminName,
        timestamp: firestore_1.FieldValue.serverTimestamp(),
        createdAt: firestore_1.FieldValue.serverTimestamp(),
        updatedAt: firestore_1.FieldValue.serverTimestamp()
    };
    await firestore.collection("userMessages").add(newAdminMessage);
    const userMessagesToUpdateQuery = firestore.collection("userMessages")
        .where("userEmail", "==", userEmail)
        .where("subject", "in", [subject, `Re: ${subject}`])
        .where("senderType", "==", "user")
        .where("status", "in", ["new", "read"]);
    const userMessagesSnapshot = await userMessagesToUpdateQuery.get();
    const batch = firestore.batch();
    userMessagesSnapshot.forEach((docToUpdate) => {
        batch.update(docToUpdate.ref, { status: 'replied', updatedAt: firestore_1.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    return { success: true };
});
exports.markMessagesAsRead = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { messageIds } = data;
    if (!messageIds || !Array.isArray(messageIds)) {
        throw new functions.https.HttpsError('invalid-argument', 'messageIds must be an array.');
    }
    const firestore = (0, firestore_1.getFirestore)();
    const batch = firestore.batch();
    messageIds.forEach(id => {
        const msgRef = firestore.collection("userMessages").doc(id);
        batch.update(msgRef, { status: 'read', updatedAt: firestore_1.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    return { success: true };
});
exports.toggleMessageThreadStatus = functions.https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { userEmail, subject, status } = data;
    if (!userEmail || !subject || !status) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required arguments: userEmail, subject, status.');
    }
    const firestore = (0, firestore_1.getFirestore)();
    const messagesQuery = firestore.collection("userMessages")
        .where("userEmail", "==", userEmail)
        .where("subject", "in", [subject, `Re: ${subject}`]);
    const messagesSnapshot = await messagesQuery.get();
    if (messagesSnapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'No messages found for this conversation thread.');
    }
    const batch = firestore.batch();
    messagesSnapshot.forEach(doc => {
        batch.update(doc.ref, { status: status, updatedAt: firestore_1.FieldValue.serverTimestamp() });
    });
    await batch.commit();
    return { success: true, message: `Conversation thread has been ${status}.` };
});
exports.uploadReport = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const { bookingId, fileName, fileDataUrl } = data;
    if (!bookingId || !fileName || !fileDataUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required data for file upload.');
    }
    const storage = (0, storage_1.getStorage)();
    const bucket = storage.bucket();
    const match = fileDataUrl.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid data URL format.');
    }
    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.]/g, '_');
    const folder = bookingId.startsWith('site_content') ? 'site_content' : 'feedback_reports';
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
    }
    catch (error) {
        logger.error(`File upload failed for booking ${bookingId}:`, error);
        throw new functions.https.HttpsError('internal', 'Failed to upload file to storage.');
    }
});
exports.getAdminBookingsPageData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    try {
        const servicesQuery = firestore.collection('services').orderBy('name', 'asc');
        const bookingsQuery = firestore.collection('bookings').orderBy('date', 'desc');
        const usersQuery = firestore.collection('userProfiles').orderBy('name', 'asc');
        const [servicesSnapshot, bookingsSnapshot, usersSnapshot] = await Promise.all([
            servicesQuery.get(),
            bookingsQuery.get(),
            usersQuery.get(),
        ]);
        const services = servicesSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const bookings = bookingsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const users = usersSnapshot.docs.map((doc) => (Object.assign({ uid: doc.id }, doc.data())));
        return { services, bookings, users };
    }
    catch (error) {
        logger.error("Error fetching admin bookings page data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch admin bookings page data.");
    }
});
exports.getAdminReportsPageData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    logger.info("getAdminReportsPageData: Admin confirmed. Fetching data...");
    const firestore = (0, firestore_1.getFirestore)();
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
            historyQuery.get(),
        ]);
        logger.info(`Fetched ${bookingsSnapshot.docs.length} completed bookings.`);
        logger.info(`Fetched ${badgesSnapshot.docs.length} badges.`);
        logger.info(`Fetched ${historySnapshot.docs.length} history entries.`);
        const completedBookings = bookingsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const badges = badgesSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const history = historySnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        logger.info("Data processing complete. Returning data to client.");
        return { completedBookings, badges, history };
    }
    catch (error) {
        logger.error("Error fetching admin reports page data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch admin reports page data.");
    }
});
exports.getAdminTestimonialsPageData = functions.runWith({ secrets: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] }).https.onCall(async (data, context) => {
    await ensureAdmin(context);
    const firestore = (0, firestore_1.getFirestore)();
    try {
        const testimonialsQuery = firestore.collection('testimonials').orderBy('createdAt', 'desc');
        const servicesQuery = firestore.collection('services').orderBy('name', 'asc');
        const bookingsQuery = firestore.collection('bookings');
        const [testimonialsSnapshot, servicesSnapshot, bookingsSnapshot] = await Promise.all([
            testimonialsQuery.get(),
            servicesQuery.get(),
            bookingsQuery.get(),
        ]);
        const testimonials = testimonialsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const services = servicesSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        const bookings = bookingsSnapshot.docs.map((doc) => (Object.assign({ id: doc.id }, doc.data())));
        return { testimonials, services, bookings };
    }
    catch (error) {
        logger.error("Error fetching admin testimonials page data:", error);
        throw new functions.https.HttpsError("internal", "Failed to fetch admin testimonials page data.");
    }
});
// New function to save hero section data
exports.saveHeroSection = functions.https.onCall(async (data, context) => {
    var _a;
    await ensureAdmin(context);
    const { heroData } = data;
    if (!heroData) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing heroData payload.');
    }
    const firestore = (0, firestore_1.getFirestore)();
    const heroDocRef = firestore.collection('siteContent').doc('homePage');
    try {
        await heroDocRef.set(Object.assign(Object.assign({}, heroData), { updatedAt: firestore_1.FieldValue.serverTimestamp() }), { merge: true });
        logger.info("Hero section data successfully saved for user:", (_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid);
        return { success: true, message: "Hero section updated successfully." };
    }
    catch (error) {
        logger.error("Error saving hero section data:", error);
        throw new functions.https.HttpsError('internal', 'Failed to save hero section data.');
    }
});
// Add more admin write functions below as needed
//# sourceMappingURL=index.js.map