
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, Booking } from '@/types';
import { auth, db, googleProvider, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInWithPopup, type ConfirmationResult, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from './use-toast';


interface AuthContextUser {
  uid: string;
  email: string;
  name: string;
  isAdmin: boolean;
  imageUrl?: string;
  emailVerified: boolean;
}

interface AuthContextType {
  currentUser: AuthContextUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ user: AuthContextUser; isAdmin: boolean }>;
  loginWithGoogle: () => Promise<{ user: AuthContextUser; isAdmin: boolean; isNewUser: boolean; }>;
  logout: () => Promise<void>;
  setupRecaptcha: (containerId: string) => Promise<RecaptchaVerifier>;
  sendOtp: (phoneNumber: string, verifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyOtp: (confirmationResult: ConfirmationResult, otp: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const checkAndCancelExpiredBookings = async (userId: string) => {
    try {
        const now = new Date();
        const bookingsRef = collection(db, "bookings");
        const q = query(
            bookingsRef,
            where("uid", "==", userId),
            where("paymentStatus", "==", "pay_later_pending"),
            where("status", "in", ["pending_approval", "accepted"])
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return;
        }
        
        const batch = writeBatch(db);
        let bookingsToCancel = 0;

        querySnapshot.forEach(doc => {
            const booking = doc.data() as Booking;
            const bookingDateTime = new Date(booking.date);
            const [timePart, ampm] = booking.time.split(' ');
            let [hours, minutes] = timePart.split(':').map(Number);
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            bookingDateTime.setHours(hours, minutes, 0, 0);

            if (bookingDateTime < now) {
                const bookingDocRef = doc(db, "bookings", doc.id);
                batch.update(bookingDocRef, {
                    status: 'cancelled',
                    paymentStatus: 'pay_later_unpaid',
                    updatedAt: serverTimestamp()
                });
                bookingsToCancel++;
            }
        });

        if (bookingsToCancel > 0) {
            await batch.commit();
            console.log(`Auto-cancelled ${bookingsToCancel} expired unpaid booking(s) for user ${userId}.`);
        }
    } catch (error) {
        console.error("Error auto-cancelling expired bookings:", error);
    }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthContextUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (firebaseUser: FirebaseUser): Promise<AuthContextUser> => {
    const userDocRef = doc(db, "userProfiles", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userProfileData = userDocSnap.data() as UserProfile;
      return {
        uid: firebaseUser.uid,
        email: userProfileData.email,
        name: userProfileData.name,
        isAdmin: userProfileData.roles?.includes('admin') || false,
        imageUrl: userProfileData.imageUrl,
        emailVerified: firebaseUser.emailVerified,
      };
    } else {
      console.warn(`Profile not found for user ${firebaseUser.uid}. This might be a new Google sign-in. A profile will be created.`);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'no-email@example.com',
        name: firebaseUser.displayName || 'New User',
        isAdmin: false,
        imageUrl: firebaseUser.photoURL || undefined,
        emailVerified: firebaseUser.emailVerified,
      };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.providerData.some(p => p.providerId === 'password') && !firebaseUser.emailVerified) {
            setCurrentUser(null);
        } else {
          const userProfile = await fetchUserProfile(firebaseUser);
          setCurrentUser(userProfile);
          checkAndCancelExpiredBookings(firebaseUser.uid);
        }
      } else {
        setCurrentUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (!firebaseUser.emailVerified) {
      await signOut(auth); // Sign out the user immediately if email is not verified
      throw new Error('Email not verified');
    }

    const userProfile = await fetchUserProfile(firebaseUser);
    setCurrentUser(userProfile);
    checkAndCancelExpiredBookings(firebaseUser.uid);
    return { user: userProfile, isAdmin: userProfile.isAdmin };
  }, [fetchUserProfile]);

  const loginWithGoogle = useCallback(async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;
    const userDocRef = doc(db, "userProfiles", firebaseUser.uid);
    const userDocSnap = await getDoc(userDocRef);

    let userProfile: AuthContextUser;
    let isNewUser = false;

    if (!userDocSnap.exists()) {
      isNewUser = true;
      const newUserProfileData = {
        name: firebaseUser.displayName || 'Google User',
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || '',
        imageUrl: firebaseUser.photoURL || undefined,
        roles: ['user'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userDocRef, newUserProfileData);
      userProfile = {
        uid: firebaseUser.uid,
        email: newUserProfileData.email!,
        name: newUserProfileData.name,
        isAdmin: false,
        imageUrl: newUserProfileData.imageUrl,
        emailVerified: firebaseUser.emailVerified,
      };
    } else {
      const existingProfileData = userDocSnap.data() as UserProfile;
      userProfile = {
        uid: firebaseUser.uid,
        email: existingProfileData.email,
        name: existingProfileData.name,
        isAdmin: existingProfileData.roles?.includes('admin') || false,
        imageUrl: existingProfileData.imageUrl,
        emailVerified: firebaseUser.emailVerified,
      };
    }
    
    setCurrentUser(userProfile);
    checkAndCancelExpiredBookings(firebaseUser.uid);
    return { user: userProfile, isAdmin: userProfile.isAdmin, isNewUser };
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
    router.push('/');
  }, [router]);

  const resendVerificationEmail = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      await sendEmailVerification(firebaseUser);
    } else {
      throw new Error("No user is currently signed in to resend verification email.");
    }
  }, []);
  
  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const setupRecaptcha = useCallback(async (containerId: string) => {
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response: any) => {
        console.log("reCAPTCHA solved");
      },
       'expired-callback': () => {
        console.log("reCAPTCHA expired");
      }
    });
    return recaptchaVerifier;
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string, verifier: RecaptchaVerifier) => {
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  }, []);

  const verifyOtp = useCallback(async (confirmationResult: ConfirmationResult, otp: string) => {
    await confirmationResult.confirm(otp);
  }, []);

  const isLoggedIn = !!currentUser;
  const isAdmin = !!currentUser && currentUser.isAdmin;

  const value = {
      currentUser,
      isLoggedIn,
      isAdmin,
      login,
      loginWithGoogle,
      logout,
      setupRecaptcha,
      sendOtp,
      verifyOtp,
      resendVerificationEmail,
      sendPasswordReset,
      loadingAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
