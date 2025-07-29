
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


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
  logout: () => Promise<void>;
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
      console.warn(`Profile not found for user ${firebaseUser.uid}. Using default auth info.`);
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


  const logout = useCallback(async () => {
    await signOut(auth);
    setCurrentUser(null);
    router.push('/');
  }, [router]);

  const isLoggedIn = !!currentUser;
  const isAdmin = !!currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, isAdmin, login, logout, loadingAuth }}>
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
