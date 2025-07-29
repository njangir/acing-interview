# Armed Forces Interview Ace - Production Deployment Plan

This document outlines the plan to transition the application from a mock-data prototype to a live, production-ready application hosted on Firebase.

## Phase 1: Backend Setup & Firebase Configuration (Backend Team)

This phase involves setting up the entire Firebase backend infrastructure. The backend team should use the `/backend_production_checklist.md` as their primary technical guide for this phase.

1.  **Firebase Project Initialization**:
    *   Set up a production Firebase project.
    *   Enable required services: Authentication (Email/Password, Google), Firestore (Native Mode), Firebase Storage, and Firebase Functions.

2.  **Data Modeling & Firestore Seeding**:
    *   Implement the Firestore collections and data schemas as defined in the checklist (`services`, `badges`, `userProfiles`, etc.).
    *   Create a data seeding script to populate initial necessary data (e.g., services, mentor profile, initial badges).

3.  **Implement Security Rules**:
    *   Develop and deploy robust Firestore Security Rules and Firebase Storage Security Rules. These are critical for protecting user data. The rules should enforce the access controls detailed in the checklist (e.g., users can only edit their own profiles, admins can edit all, etc.).

4.  **Develop Backend Logic (Firebase Functions)**:
    *   Implement all required backend logic as Cloud Functions. Key functions include:
        *   **User Management**: `onUserCreate` trigger to create user profiles.
        *   **Payment Gateway Integration**: Functions like `createPaymentOrder` and `confirmBooking` to handle interactions with a payment provider (e.g., Razorpay, Stripe).
        *   **Booking Management**: Functions or admin SDK logic for booking status updates (accept, cancel, complete).
        *   **Automated Tasks**: (Optional but recommended) Cron jobs for tasks like `autoCancelUnpaidBookings`.

## Phase 2: Frontend Integration & Refactoring (Frontend Team)

This phase involves systematically replacing all mock data and simulated logic with live calls to the Firebase backend.

1.  **Firebase Initialization**:
    *   Create a `src/lib/firebase.ts` file to initialize the Firebase app using the configuration from the backend team. This config will be used throughout the application.

2.  **Authentication Refactoring**:
    *   In `src/hooks/use-auth.ts`, replace the `localStorage`-based mock authentication with actual Firebase Authentication (`onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`).
    *   The `login` function in the hook should be updated to fetch the user's profile from your "userProfiles" Firestore collection to get their name, roles (`isAdmin`), and other details.

3.  **Data Fetching Refactoring (Component by Component)**:
    *   Go through each page and component that currently uses mock data from `src/constants/index.ts`.
    *   Remove the mock data imports and replace them with real-time data fetching from Firestore using the Firebase SDK.
    *   Utilize `useEffect` with `getDocs` (for one-time fetches) or `onSnapshot` (for real-time updates) as appropriate. Admin pages will benefit most from `onSnapshot`.

4.  **Data Mutation Refactoring**:
    *   Go through each page where data is created or updated (e.g., booking pages, admin forms).
    *   Replace mock data array manipulations (`MOCK_BOOKINGS.push(...)`) with Firestore `addDoc`, `updateDoc`, and `deleteDoc` calls.
    *   Replace file upload simulations with calls to Firebase Storage (`uploadBytes`, `getDownloadURL`).
    *   For actions requiring backend logic (like payment processing), replace simulation with `httpsCallable` to invoke the Firebase Functions created in Phase 1.

## Phase 3: Final Testing & Deployment

1.  **Environment Configuration**:
    *   Ensure API keys and any sensitive configuration for production are managed securely, for example using `.env.local` for local development and setting secrets for the deployed App Hosting environment.

2.  **Comprehensive End-to-End Testing**:
    *   Test the entire user flow with the live Firebase backend: user signup, booking, payment, feedback submission, admin actions, etc.
    *   Verify that all security rules are working as expected by testing access permissions for both regular users and admins.

3.  **Deployment**:
    *   Once testing is complete, deploy the Next.js application to Firebase App Hosting.
    *   Ensure the `apphosting.yaml` file is configured correctly for production (`maxInstances`, etc.).
    *   The `firebase deploy` command will handle deploying the app and any associated backend resources like Functions and security rules.

By following this phased plan, your teams can work in parallel and ensure a smooth, secure, and successful launch.
