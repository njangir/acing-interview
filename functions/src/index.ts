/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onUserCreate } from "firebase-functions/v2/auth";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { MOCK_BADGES } from "./constants";

initializeApp();

// This function triggers whenever a new user is created in Firebase Auth.
exports.oncreateuser = onUserCreate(async (event) => {
  logger.info("New user created:", event.data.uid);

  const { uid, email, displayName, photoURL } = event.data;

  // Find the default badge to award to new users.
  const defaultBadge = MOCK_BADGES.find(
    (badge) => badge.id === "commendable_effort",
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // For Firestore server timestamps, you'd use FieldValue.serverTimestamp()
  };

  try {
    const firestore = getFirestore();
    await firestore
      .collection("userProfiles")
      .doc(uid)
      .set(newUserProfile);
    logger.info(`Successfully created profile for user: ${uid}`);
    return;
  } catch (error) {
    logger.error(`Error creating profile for user: ${uid}`, error);
    return;
  }
});
