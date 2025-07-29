# Armed Forces Interview Ace - Production Deployment Plan

This document outlines the step-by-step plan to transition the application from a mock-data prototype to a live, production-ready application hosted on Firebase.

## Phase 1: Foundational Backend Setup

This phase involves setting up the entire Firebase backend infrastructure. We must complete this before any frontend refactoring.

1.  **Firebase Project Initialization**:
    *   Set up a production Firebase project.
    *   Enable required services: Authentication (Email/Password, Google), Firestore (Native Mode), Firebase Storage, and Firebase Functions.

2.  **Data Modeling & Firestore Seeding**:
    *   Implement the Firestore collections and data schemas as defined in `backend_production_checklist.md`.
    *   Create a data seeding script to populate initial necessary data (e.g., at least one service, mentor profile, initial badges).

3.  **Develop Backend Logic (Core Functions)**:
    *   Implement the `onUserCreate` Cloud Function (Auth Trigger) to create a corresponding `userProfile` document in Firestore when a new Firebase Auth user signs up.
    *   Implement other critical functions like `createPaymentOrder` and `confirmBooking` for payment integration.

4.  **Implement Initial Security Rules**:
    *   Develop and deploy foundational Firestore and Storage Security Rules. These are critical for protecting user data. The initial rules should be robust enough for the upcoming authentication tests.

## Phase 2: Authentication Overhaul & Testing

This phase focuses on replacing the mock authentication system with live Firebase Authentication.

1.  **Refactor Frontend Auth**:
    *   Create a `src/lib/firebase.ts` file to initialize the Firebase app using the configuration from Phase 1.
    *   In `src/hooks/use-auth.ts`, replace the `localStorage`-based mock authentication with actual Firebase Authentication (`onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`).
    *   The `login` function in the hook must be updated to fetch the user's profile from the "userProfiles" Firestore collection to get their name, roles (`isAdmin`), and other details.

2.  **Test Authentication Flow**:
    *   **Goal**: Verify that users can sign up, log in, and log out using Firebase.
    *   **Steps**:
        *   Create a new user through the signup page. Verify the user is created in Firebase Authentication.
        *   Verify that the `onUserCreate` function successfully created a corresponding document in the `userProfiles` collection in Firestore.
        *   Log out and log back in with the new user's credentials.
        *   Test authentication-protected routes (e.g., `/dashboard`, `/admin`) to ensure they correctly redirect unauthenticated users.
        *   Test with an "admin" user (manually set the role in Firestore) to verify admin-only routes are accessible.

## Phase 3: Read-Only Data Integration & Testing

This phase connects pages that primarily display data, replacing mock data with live Firestore reads.

1.  **Refactor Data-Display Pages**:
    *   Go through each page that displays a list of items: `/services`, `/mentor`, `/testimonials`.
    *   Remove mock data imports (e.g., `MOCK_SERVICES`) and replace them with real-time data fetching from Firestore using the Firebase SDK (e.g., `getDocs`, `collection`).
    *   Update the components to handle loading and error states during data fetching.

2.  **Test Data Display**:
    *   **Goal**: Ensure all public-facing and dashboard pages correctly display data from Firestore.
    *   **Steps**:
        *   Verify that the Services page correctly lists all services from the Firestore collection.
        *   Check that the Mentor Profile page displays the data from the mentor profile document.
        *   Confirm that the Testimonials page shows only "approved" testimonials from Firestore.
        *   Test with an empty collection to ensure the "No data available" UI state works correctly.
        *   Test the dashboard pages (e.g., "My Bookings") to ensure they correctly filter and display data for the logged-in user.

## Phase 4: Data Mutation & End-to-End Testing

This is the most critical phase, where we replace all mock data creation/updates with live Firestore writes.

1.  **Refactor Data Mutation Components**:
    *   **Booking Flow**: Refactor the slot selection and payment pages (`/book/[serviceId]/slots`, `/book/[serviceId]/payment`). Replace mock logic with Firestore calls to check slot availability and create booking documents. Integrate calls to the `createPaymentOrder` and `confirmBooking` Cloud Functions.
    *   **Admin Panels**: Refactor all admin pages (`/admin/...`) to perform CRUD (Create, Read, Update, Delete) operations directly on the corresponding Firestore collections (bookings, services, testimonials, etc.).
    *   **File Uploads**: Replace file upload simulations (e.g., on the reports and testimonials pages) with calls to Firebase Storage (`uploadBytes`, `getDownloadURL`).

2.  **Test End-to-End User Flows**:
    *   **Goal**: Verify all user actions that modify data are working correctly.
    *   **Steps**:
        *   **User Flow**: Perform a complete booking flow as a regular user: select a service, pick a slot, choose a payment option, and verify the booking document is created correctly in Firestore with the right status.
        *   **Admin Flow**: As an admin, perform key actions: accept a pending booking, add a meeting link, mark a session as complete, upload a feedback report, and assign a badge. Verify each action correctly updates the data in Firestore.
        *   **Test Security Rules**: Manually attempt actions that should be denied (e.g., a regular user trying to edit another user's booking) to ensure security rules are working as expected.

## Phase 5: Final Production Prep & Deployment

With all functionality on the live backend, we perform final checks before deployment.

1.  **Environment Configuration**:
    *   Ensure all production API keys and sensitive configurations are managed securely using environment variables. Set them in the App Hosting secrets manager.
    *   Update `apphosting.yaml` for production settings (e.g., `maxInstances`).

2.  **Final Comprehensive Testing**:
    *   Perform a full regression test of the entire application with multiple user accounts (admin and regular).
    *   Test on different devices and browsers to check for responsiveness and compatibility issues.

3.  **Deployment**:
    *   Run the `firebase deploy` command to deploy the Next.js application to Firebase App Hosting and any updated backend resources (Functions, security rules).

By following this phased plan with integrated testing, we can ensure a smooth, secure, and successful launch.