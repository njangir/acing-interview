
'use client';

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (user?: AuthUser) => void; // Made user optional to handle mock signup
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
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
      } catch (e) {
        console.error("Error parsing stored user data", e);
        localStorage.removeItem('currentUserAFIA');
      }
    }
  }, []);

  const login = useCallback((user?: AuthUser) => { // Updated to accept optional user
    if (user) {
      localStorage.setItem('currentUserAFIA', JSON.stringify(user));
      setCurrentUser(user);
    } else {
      // Handle generic login for signup (no specific user data yet, or default)
      const mockUser: AuthUser = { email: 'user@example.com', name: 'New User', isAdmin: false };
      localStorage.setItem('currentUserAFIA', JSON.stringify(mockUser));
      setCurrentUser(mockUser);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUserAFIA');
    setCurrentUser(null);
    router.push('/'); 
  }, [router]);

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
