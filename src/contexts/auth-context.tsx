
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { auth, database } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { ref, get, query, equalTo, orderByChild } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  loginName: string;
  role: string;
  warehouse: string;
  uid?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (loginName: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy sign-in function for the fake auth system
const fakeSignIn = async (loginName: string, pass: string) => {
  // This function will not be called in the new setup but is kept for type consistency.
};

// Dummy sign-out function
const fakeSignOut = async () => {
    // In a real scenario, you might clear local storage or state.
    // For this implementation, we will simply reload to reset the state.
    window.location.reload();
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // We will create a fake user object for the admin
  const adminUser: User = {
    id: 'admin_user_id',
    name: 'مسؤول النظام',
    loginName: 'admin',
    role: 'مسؤول',
    warehouse: 'all',
    uid: 'admin_user_uid',
  };

  const [user, setUser] = useState<User | null>(adminUser);
  const [loading, setLoading] = useState(false); // Set loading to false as we are not fetching anything.
  const [authError, setAuthError] = useState<string | null>(null);
  
  // The provider will simply render the children with the hardcoded admin user.
  // This bypasses the entire login flow.
  return (
    <AuthContext.Provider value={{ user, loading, signIn: fakeSignIn, signOut: fakeSignOut, error: authError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
