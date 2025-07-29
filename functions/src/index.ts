/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { MOCK_BADGES } from "./constants";
import Razorpay from "razorpay";
import { defineString } from "firebase-functions/params";
import crypto from "crypto";

initializeApp();

const RAZORPAY_KEY_ID = defineString("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineString("RAZORPAY_KEY_SECRET");

// This function triggers whenever a new user is created in Firebase Auth.
exports.oncreateuser = onUserCreate(async (event) => {
  logger.info("New user created:", event.data.uid);

  const { uid, email, displayName, photoURL } = event.data;

  // Find the default badge to award to new users.
  const defaultBadge = MOCK_BADGES.find(
    (badge) => badge.id === "commendable_effort"
  );
  const awardedBadgeIds: string[] = [];
  if (defaultBadge) {
    awardedBadgeIds.push(defaultBadge.id);
  }

  // Create a new user profile document in the 'userProfiles' collection.
  const newUserProfile = {
    name: displayName || "New User",
    email: email,
    phone: "", // Phone number is collected separately
    imageUrl: photoURL || "", // Default avatar can be set on client if empty
    roles: ["user"], // Assign a default 'user' role.
    awardedBadgeIds: awardedBadgeIds,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    const firestore = getFirestore();
    await firestore.collection("userProfiles").doc(uid).set(newUserProfile);
    logger.info(`Successfully created profile for user: ${uid}`);
    return;
  } catch (error) {
    logger.error(`Error creating profile for user: ${uid}`, error);
    return;
  }
});

exports.createPaymentOrder = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { amount, bookingId } = request.data;
  if (!amount || !bookingId) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'amount' and 'bookingId' arguments."
    );
  }

  const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID.value(),
    key_secret: RAZORPAY_KEY_SECRET.value(),
  });

  const options = {
    amount: amount * 100, // Amount in paise
    currency: "INR",
    receipt: `receipt_booking_${bookingId}`,
    notes: {
      bookingId: bookingId,
      userId: request.auth.uid,
    },
  };

  try {
    const order = await razorpay.orders.create(options);
    logger.info("Razorpay order created:", { orderId: order.id, bookingId });
    return {
      orderId: order.id,
      keyId: RAZORPAY_KEY_ID.value(),
    };
  } catch (error) {
    logger.error("Error creating Razorpay order:", error);
    throw new HttpsError("internal", "Could not create payment order.", error);
  }
});

exports.verifyPayment = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    bookingId,
  } = request.data;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !bookingId
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required payment verification details."
    );
  }

  const shasum = crypto.createHmac("sha256", RAZORPAY_KEY_SECRET.value());
  shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = shasum.digest("hex");

  if (digest !== razorpay_signature) {
    logger.warn("Transaction tampering detected", { bookingId });
    throw new HttpsError("permission-denied", "Payment verification failed.");
  }

  // Signature is valid, update the booking in Firestore
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
    throw new HttpsError(
      "internal",
      "Payment verified, but failed to update booking."
    );
  }
});
