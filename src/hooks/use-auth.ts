
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types'; // Import UserProfile type

// This will represent the core user data available in the auth context
// It's a subset of UserProfile, plus isAdmin which might come from custom claims or UserProfile.roles
interface AuthContextUser {
  uid: string; // Firebase Auth UID
  email: string;
  name: string;
  isAdmin: boolean;
  imageUrl?: string;
  // You might add other frequently accessed, non-sensitive UserProfile fields here
}

interface AuthContextType {
  currentUser: AuthContextUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  // login function would typically be called after Firebase Auth success
  // It would then fetch/set the user profile data into the context
  login: (userAuthData: { uid: string; email: string; displayName?: string | null; photoURL?: string | null }) => Promise<void>;
  logout: () => Promise<void>; // Logout can also be async
  loadingAuth: boolean; // To indicate if auth state is being determined
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthContextUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // Start as true
  const router = useRouter();

  // Simulate Firebase onAuthStateChanged listener
  useEffect(() => {
    setLoadingAuth(true);
    const storedUser = localStorage.getItem('currentUserAFIA_authUser'); // Store core auth user
    if (storedUser) {
      try {
        const parsedUser: AuthContextUser = JSON.parse(storedUser);
        // In a real Firebase app, you would verify the token or use onAuthStateChanged
        // For now, we trust localStorage for the mock
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Error parsing stored auth user data", e);
        localStorage.removeItem('currentUserAFIA_authUser');
      }
    }
    setLoadingAuth(false);
  }, []);

  const login = useCallback(async (userAuthData: { uid: string; email: string; displayName?: string | null; photoURL?: string | null }) => {
    setLoadingAuth(true);
    // PRODUCTION TODO:
    // 1. After Firebase signInWithEmailAndPassword or GoogleSignIn succeeds, you get Firebase User object.
    //    const firebaseUser = userAuthData; (userAuthData would be the firebase.User object)
    // 2. Fetch UserProfile from Firestore using firebaseUser.uid
    //    const userProfileDocRef = doc(db, "userProfiles", firebaseUser.uid);
    //    const userProfileSnap = await getDoc(userProfileDocRef);
    //    if (userProfileSnap.exists()) {
    //      const userProfileData = userProfileSnap.data() as UserProfile;
    //      const authContextUser: AuthContextUser = {
    //        uid: firebaseUser.uid,
    //        email: userProfileData.email,
    //        name: userProfileData.name,
    //        isAdmin: userProfileData.roles?.includes('admin') || false,
    //        imageUrl: userProfileData.imageUrl,
    //      };
    //      localStorage.setItem('currentUserAFIA_authUser', JSON.stringify(authContextUser));
    //      setCurrentUser(authContextUser);
    //    } else {
    //      // Handle case where user exists in Auth but not in Firestore (e.g., first-time social login needing profile setup)
    //      console.error("User profile not found in Firestore for UID:", firebaseUser.uid);
    //      // Potentially redirect to a profile creation page or create a default profile.
    //      // For now, we might log them out or use minimal data.
    //      // For mock, we'll try to retrieve from `mockUserProfile_${email}` if it exists
    //      const mockProfileData = localStorage.getItem(`mockUserProfile_${userAuthData.email}`);
    //      if (mockProfileData) {
    //         const parsedMockProfile = JSON.parse(mockProfileData) as UserProfile;
    //         const authContextUser: AuthContextUser = {
    //             uid: userAuthData.uid, // Use UID from auth
    //             email: userAuthData.email,
    //             name: parsedMockProfile.name || userAuthData.displayName || 'User',
    //             isAdmin: parsedMockProfile.roles?.includes('admin') || (userAuthData.email === 'admin@example.com'), // Mock admin logic
    //             imageUrl: parsedMockProfile.imageUrl || userAuthData.photoURL,
    //         };
    //         localStorage.setItem('currentUserAFIA_authUser', JSON.stringify(authContextUser));
    //         setCurrentUser(authContextUser);
    //      } else {
    //         // Fallback if no mock profile either
    //         const authContextUser: AuthContextUser = {
    //             uid: userAuthData.uid,
    //             email: userAuthData.email,
    //             name: userAuthData.displayName || 'User',
    //             isAdmin: userAuthData.email === 'admin@example.com', // Mock admin logic
    //             imageUrl: userAuthData.photoURL,
    //         };
    //         localStorage.setItem('currentUserAFIA_authUser', JSON.stringify(authContextUser));
    //         setCurrentUser(authContextUser);
    //      }
    //    }
    // MOCK IMPLEMENTATION:
    const mockProfileKey = `mockUserProfile_${userAuthData.email}`;
    const storedMockProfile = localStorage.getItem(mockProfileKey);
    let userProfile: UserProfile | null = null;
    if (storedMockProfile) {
        userProfile = JSON.parse(storedMockProfile);
    }

    const authContextUser: AuthContextUser = {
        uid: userAuthData.uid, // Important: UID comes from actual auth event
        email: userAuthData.email,
        name: userProfile?.name || userAuthData.displayName || 'User',
        isAdmin: userProfile?.roles?.includes('admin') || (userAuthData.email === 'admin@example.com'), // Example admin logic
        imageUrl: userProfile?.imageUrl || userAuthData.photoURL,
    };
    localStorage.setItem('currentUserAFIA_authUser', JSON.stringify(authContextUser));
    setCurrentUser(authContextUser);
    setLoadingAuth(false);
  }, []);

  const logout = useCallback(async () => {
    setLoadingAuth(true);
    // PRODUCTION TODO: await signOut(auth); // Firebase sign out
    localStorage.removeItem('currentUserAFIA_authUser');
    // Note: `mockUserProfile_${email}` is separate and not cleared here by default,
    // it represents more persistent profile data. Could be cleared if desired.
    setCurrentUser(null);
    setLoadingAuth(false);
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
