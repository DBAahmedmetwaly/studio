
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  name: string;
  loginName: string;
  role: string;
  warehouse: string;
  uid: string; // Firebase Auth UID
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (loginName: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for bypassing Firebase Auth issues
const mockUser: User = {
    id: 'admin_user_id',
    name: 'مسؤول النظام',
    loginName: 'admin',
    role: 'مسؤول',
    warehouse: 'all',
    uid: 'mock_admin_uid'
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(mockUser); // Directly set mock user
  const [loading, setLoading] = useState(false); // Set loading to false as we are not fetching anything

  const signIn = async (loginName: string, pass: string): Promise<void> => {
    // This function will not be called in mock mode but is kept for interface compatibility
    console.log("Attempted to sign in with:", loginName);
    return Promise.resolve();
  };

  const signOut = async (): Promise<void> => {
     // In a real scenario, you might want to clear the user
    setUser(null);
    console.log("Signed out.");
    return Promise.resolve();
  };

  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mr-2">جارٍ التحقق من تسجيل الدخول...</p>
          </div>
      )
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
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
