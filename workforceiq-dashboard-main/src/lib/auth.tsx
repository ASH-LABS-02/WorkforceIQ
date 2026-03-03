import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';

import { User, UserRole } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const getRoleFromEmail = (email: string): UserRole => {
  if (email.includes('admin')) return 'admin';
  if (email.includes('manager')) return 'manager';
  if (email.includes('hr')) return 'hr';
  if (email.includes('recruiter')) return 'recruiter';
  return 'user';
};

const mapFirebaseUser = (firebaseUser: FirebaseUser): User => ({
  id: firebaseUser.uid,
  name: firebaseUser.email?.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'User',
  email: firebaseUser.email || '',
  role: getRoleFromEmail(firebaseUser.email || ''),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('wiq_token', token);
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        localStorage.removeItem('wiq_token');
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      try {
        // Attempt login
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(mapFirebaseUser(userCredential.user));
      } catch (error: any) {
        console.error('Firebase Auth Sign-In Error:', error.code, error.message);

        // If user not found, auto-register
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
          try {
            console.log('Attempting auto-registration for:', email);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            setUser(mapFirebaseUser(userCredential.user));
          } catch (regError: any) {
            console.error('Firebase Auth Registration Error:', regError.code, regError.message);
            if (regError.code === 'auth/operation-not-allowed') {
              toast.error('Sign-up is not enabled in Firebase Console. Please enable Email/Password provider.');
            } else if (regError.code === 'auth/email-already-in-use') {
              toast.error('Invalid password for existing account.');
            } else {
              toast.error(`Registration failed: ${regError.message}`);
            }
            throw regError;
          }
        } else if (error.code === 'auth/operation-not-allowed') {
          toast.error('Email/Password login is not enabled in Firebase Console.');
          throw error;
        } else {
          throw error;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
