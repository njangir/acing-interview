
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const storedLoginStatus = localStorage.getItem('isLoggedInAFIA');
    if (storedLoginStatus === 'true') {
      setIsLoggedIn(true);
    }
  }, []);

  const login = useCallback(() => {
    localStorage.setItem('isLoggedInAFIA', 'true');
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isLoggedInAFIA');
    setIsLoggedIn(false);
    router.push('/'); // Redirect to home page on logout
  }, [router]);

  return { isLoggedIn, login, logout };
}
