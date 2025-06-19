
# Backend Production-Ready Checklist for "Armed Forces Interview Ace"

This document outlines the necessary backend tasks and considerations for transitioning the "Armed Forces Interview Ace" application to a production environment using Firebase.

## I. Firebase Project Setup & Core Services

*   [ ] **Firebase Project**: Create a new Firebase project or configure an existing one.
*   [ ] **Firebase Authentication**:
    *   [ ] Enable Email/Password authentication.
    *   [ ] (Optional) Configure social providers (e.g., Google).
    *   [ ] Implement email verification flow for new signups.
    *   [ ] Implement password reset functionality.
*   [ ] **Firestore Database**:
    *   [ ] Initialize Firestore in Native mode.
    *   [ ] Define and implement necessary Firestore Security Rules (see Section IV).
*   [ ] **Firebase Storage**:
    *   [ ] Set up Firebase Storage.
    *   [ ] Define and implement Storage Security Rules (see Section IV).
*   [ ] **Firebase Functions**:
    *   [ ] Set up Firebase Functions environment for backend logic.
    *   [ ] Configure environment variables securely (e.g., for API keys).
*   [ ] **App Hosting**: Ensure `apphosting.yaml` is configured for production (e.g., `maxInstances`, region).

## II. Data Modeling & Firestore Collections

For each collection, define schema, indexes, and relationships. Ensure `createdAt` and `updatedAt` fields (using `serverTimestamp()`) are used.

*   [ ] **`userProfiles` Collection**:
    *   Schema: `uid` (document ID, matches Auth UID), `name`, `email`, `phone`, `imageUrl` (link to Storage), `roles` (e.g., `['user', 'admin']`), `awardedBadgeIds` (array of badge IDs), `gender`, `targetOrganization`, `createdAt`, `updatedAt`.
    *   Admin role management (consider Firebase Custom Claims for `isAdmin` if preferred for security and ease of access in rules/client).
*   [ ] **`services` Collection**:
    *   Schema: `name`, `description`, `price`, `duration`, `features` (array), `image` (link to Storage), `dataAiHint`, `defaultForce`, `isBookable` (boolean), `createdAt`, `updatedAt`.
    *   Admin CRUD operations for services need to be implemented.
*   [ ] **`bookings` Collection**:
    *   Schema: `uid` (user's UID), `serviceId`, `serviceName`, `date` (YYYY-MM-DD string or Timestamp), `time`, `userName`, `userEmail`, `meetingLink` (string, can be empty), `status` (enum), `paymentStatus` (enum), `transactionId` (nullable string), `reportUrl` (nullable string), `userFeedback` (string), `detailedFeedback` (array of objects: `{ skill: string, rating: string, comments?: string }`), `requestedRefund` (boolean), `refundReason` (string), `createdAt`, `updatedAt`.
    *   Admin actions (accept, cancel, complete, edit) need backend implementation.
*   [ ] **`serviceAvailability` Collection (or similar structure)**:
    *   Schema for managing bookable slots.
        *   Option 1 (Global): Document ID `YYYY-MM-DD`, field `timeSlots` (array of strings).
        *   Option 2 (Per-Service): Subcollection under `services` (e.g., `services/{serviceId}/availability/{dateString}`) or a top-level collection like `serviceAvailabilities/{serviceId}_{dateString}`.
    *   Admin management of slots needs backend implementation.
*   [ ] **`testimonials` Collection**:
    *   Schema: `uid` (user's UID), `name`, `userEmail`, `batch`, `story`, `imageUrl` (user's avatar from profile), `dataAiHint` (for avatar), `serviceTaken`, `serviceId`, `submissionStatus`, `selectedForce`, `interviewLocation`, `numberOfAttempts`, `bodyImageUrl` (link to Storage, optional), `bodyImageDataAiHint` (optional), `status` ('pending', 'approved', 'rejected'), `createdAt`, `updatedAt`.
    *   Admin approval/rejection flow.
*   [ ] **`resources` Collection**:
    *   Schema: `title`, `type` (enum: 'video', 'document', 'link'), `url` (link to Storage for documents, external URL otherwise), `description`, `serviceCategory` (links to `services.id` or 'general'), `createdAt`, `updatedAt`.
    *   Admin CRUD operations.
*   [ ] **`userMessages` Collection**:
    *   Schema: `uid` (user's UID), `userName`, `userEmail`, `subject`, `messageBody`, `timestamp` (serverTimestamp), `status` ('new', 'read', 'replied', 'closed'), `senderType` ('user', 'admin'), `adminName` (if admin reply), `createdAt`, `updatedAt`.
    *   Real-time updates for admin panel (using `onSnapshot` on client is okay, but message creation/status updates from admin go through backend or are directly written with security rules).
*   [ ] **`badges` Collection**:
    *   Schema: `name`, `description`, `force`, `rankName`, `imageUrl` (link to Storage), `dataAiHint`, `createdAt`, `updatedAt`.
    *   Admin CRUD operations.
*   [ ] **`feedbackSubmissions` Collection (Audit Log)**:
    *   Schema: `submissionDate` (serverTimestamp), `bookingId`, `adminUid`, `userName`, `serviceName`, `reportFileName`, `reportUrl`, `badgeAssignedId` (optional), `badgeAssignedName` (optional), `createdAt`.
*   [ ] **`userNotifications` Collection (Optional but Recommended for robust notifications)**:
    *   Schema: `userId` (UID), `message`, `timestamp`, `href`, `type`, `seen` (boolean).
    *   Subcollection under users: `users/{userId}/notifications/{notificationId}`.
    *   Functions to generate notifications for booking updates, new messages, etc.

## III. Backend Logic & Firebase Functions

*   [ ] **Payment Gateway Integration (e.g., Razorpay, Stripe)**:
    *   [ ] Cloud Function: `createPaymentOrder` - Takes booking details, service price, `userId`. Creates an order with the payment gateway, returns `orderId` and gateway `key` to the client.
    *   [ ] Cloud Function: `confirmBooking` - Takes payment gateway response (`paymentId`, `orderId`, `signature`), verifies payment with gateway.
        *   If verified: Updates booking status to 'accepted' or 'scheduled' in Firestore.
        *   Sets `paymentStatus` to 'paid' and records `transactionId`.
        *   (Optional) Generates initial `meetingLink` if applicable.
        *   (Optional) Sends a confirmation notification to the user.
*   [ ] **Booking Management Functions**:
    *   [ ] Cloud Function (or admin SDK direct write with rules): Update booking status (accept, cancel, complete, schedule by adding meeting link).
    *   [ ] (Optional) Cloud Function: `autoCancelUnpaidBookings` - Cron job to check 'pay\_later\_pending' bookings close to session time and mark them as 'cancelled' and 'pay\_later\_unpaid' if payment isn't made.
    *   [ ] Cloud Function: Process refund requests (update booking status, potentially interact with payment gateway for actual refund if `paymentStatus` was 'paid').
*   [ ] **Notification Generation Functions (if using `userNotifications` collection)**:
    *   [ ] On booking status change (Firestore Trigger).
    *   [ ] On new admin reply to a user message (Firestore Trigger).
    *   [ ] On feedback report upload for a completed session (Firestore Trigger).
*   [ ] **User Message Handling**:
    *   While client can write new messages directly with rules, status updates (e.g., admin marking as 'read' or 'replied') might benefit from a function if complex side effects are needed.
*   [ ] **User Profile Management**:
    *   [ ] Cloud Function: `onUserCreate` (Auth Trigger) - Create a corresponding `userProfile` document in Firestore when a new Firebase Auth user signs up. Assign default roles/badges.
    *   [ ] Cloud Function (or admin SDK): Assign/remove badges from `userProfiles/{uid}/awardedBadgeIds`.
*   [ ] **Data Export (Admin Panel)**:
    *   [ ] Cloud Function(s): `exportBookingsReport`, `exportUsersReport`, `exportServicesReport` that generate JSON/CSV data from Firestore collections. These can be HTTP-callable functions.

## IV. Security Rules

*   [ ] **Firestore Security Rules**:
    *   `userProfiles`: Users can read/write their own profile. Admins can read all.
    *   `services`: Publicly readable. Writable only by admins.
    *   `bookings`: Users can read/write (create, request refund) their own bookings. Admins can read all and update status/details.
    *   `serviceAvailability`: Publicly readable (for slot display). Writable only by admins.
    *   `testimonials`: Users can create. Admins can read/update status. Approved testimonials are publicly readable.
    *   `resources`: Readable by users based on entitlements (e.g., purchased services - may require more complex rules or backend filtering). Writable only by admins.
    *   `userMessages`: Users can create messages to admin. Admins can read all and create replies (messages with `senderType: 'admin'`). Users can only read messages in their own "thread" (where `userEmail` matches).
    *   `badges`: Publicly readable. Writable only by admins.
    *   `feedbackSubmissions`: Writable only by admins. Readable by admins.
    *   `userNotifications` (if used): Users can only read/update 'seen' status for their own notifications. Backend functions write new notifications.
*   [ ] **Firebase Storage Security Rules**:
    *   Service images (`services/`): Publicly readable. Writable by admins.
    *   Testimonial body images (`testimonials_body_images/`): Users can write to a path related to their UID. Publicly readable if linked from an approved testimonial.
    *   Feedback reports (`feedback_reports/`): Writable by admins. Readable by users if they own the corresponding booking (requires UID matching or signed URLs).
    *   User profile images: Users can write their own. Publicly readable.

## V. Best Practices & Considerations

*   [ ] **Idempotency**: Ensure backend functions that modify data are idempotent where possible (e.g., processing a payment confirmation).
*   [ ] **Error Handling & Logging**: Implement comprehensive error handling and logging (e.g., Cloud Functions logs) for all backend operations.
*   [ ] **Scalability**: Consider Firestore query limitations and data structures for scalability (e.g., denormalization vs. complex queries).
*   [ ] **Indexing**: Define necessary Firestore composite indexes for queries.
*   [ ] **Cost Management**: Be mindful of Firebase read/write/invocation costs. Optimize queries and function execution.
*   [ ] **Environment Configuration**: Use Firebase project aliases (`firebase use <alias>`) for staging/production environments. Manage API keys and sensitive data via Firebase Functions environment configuration or a service like Google Secret Manager.
*   [ ] **Testing**:
    *   [ ] Unit tests for Cloud Functions.
    *   [ ] Security rules testing using Firebase Emulator Suite.
*   [ ] **Deployment**: CI/CD pipeline for deploying Functions, Firestore rules, and indexes.
*   [ ] **Data Backups**: Configure Firestore backups.
*   [ ] **GDPR/Privacy**: Ensure data handling complies with relevant privacy regulations.

## VI. Frontend Handoff Points

The frontend will expect the following:

*   User authentication state from Firebase Auth.
*   Data to be available in the defined Firestore collections.
*   Firebase Storage URLs for images/files.
*   (If applicable) HTTP-callable Cloud Functions for specific actions (e.g., creating payment orders, triggering reports).

This checklist should provide a solid roadmap for your backend team. Good luck with the production deployment!
