
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { auth, db, googleProvider, RecaptchaVerifier, signInWithPhoneNumber } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser, signInWithPopup, type ConfirmationResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firestore';


interface AuthContextUser {
  uid: string;
  email: string;
  name: string;
  isAdmin: boolean;
  imageUrl?: string;
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
  loadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthContextUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const router = useRouter();

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
      };
    } else {
      console.warn(`Profile not found for user ${firebaseUser.uid}. This might be a new Google sign-in. A profile will be created.`);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'no-email@example.com',
        name: firebaseUser.displayName || 'New User',
        isAdmin: false,
        imageUrl: firebaseUser.photoURL || undefined,
      };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userProfile = await fetchUserProfile(firebaseUser);
        setCurrentUser(userProfile);
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
    const userProfile = await fetchUserProfile(firebaseUser);
    setCurrentUser(userProfile);
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
      };
    } else {
      const existingProfileData = userDocSnap.data() as UserProfile;
      userProfile = {
        uid: firebaseUser.uid,
        email: existingProfileData.email,
        name: existingProfileData.name,
        isAdmin: existingProfileData.roles?.includes('admin') || false,
        imageUrl: existingProfileData.imageUrl,
      };
    }
    
    setCurrentUser(userProfile);
    return { user: userProfile, isAdmin: userProfile.isAdmin, isNewUser };
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
    router.push('/');
  }, [router]);
  
  // PRODUCTION TODO: Implement the full multi-step UI flow for OTP.
  // These functions provide the Firebase logic.
  const setupRecaptcha = useCallback(async (containerId: string) => {
    // Ensure the reCAPTCHA container is visible and empty.
    // window.recaptchaVerifier would be an instance variable if you need to access it across calls.
    const recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log("reCAPTCHA solved");
      },
       'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        console.log("reCAPTCHA expired");
      }
    });
    return recaptchaVerifier;
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string, verifier: RecaptchaVerifier) => {
    // Phone number must be in E.164 format (e.g., +11234567890)
    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  }, []);

  const verifyOtp = useCallback(async (confirmationResult: ConfirmationResult, otp: string) => {
    await confirmationResult.confirm(otp);
  }, []);

  const isLoggedIn = !!currentUser;
  const isAdmin = !!currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, isAdmin, login, loginWithGoogle, logout, setupRecaptcha, sendOtp, verifyOtp, loadingAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
