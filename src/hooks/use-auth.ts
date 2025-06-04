
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  email: string;
  name: string;
  isAdmin: boolean;
  imageUrl?: string; // Added for avatar
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (user: AuthUser) => void; // User object now includes imageUrl
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUserAFIA');
    if (storedUser) {
      try {
        const parsedUser: AuthUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Error parsing stored user data", e);
        localStorage.removeItem('currentUserAFIA');
      }
    }
  }, []);

  const login = useCallback((user: AuthUser) => { 
    localStorage.setItem('currentUserAFIA', JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUserAFIA');
    setCurrentUser(null);
    // Also clear specific user profile data like avatars and badges on logout for this demo
    // This part is very specific to the mock setup and might not be needed in a real app
    if (currentUser?.email) {
      localStorage.removeItem(`mockUserProfile_${currentUser.email}`);
    }
    router.push('/'); 
  }, [router, currentUser]);

  const isLoggedIn = !!currentUser;
  const isAdmin = !!currentUser && currentUser.isAdmin;

  return (
    <AuthContext.Provider value={{ currentUser, isLoggedIn, isAdmin, login, logout }}>
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
