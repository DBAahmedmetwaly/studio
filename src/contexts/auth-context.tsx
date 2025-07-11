
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { auth, database } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { ref, get, query, equalTo, orderByChild } from 'firebase/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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

const LoginPage = ({ onSignIn, loading, error }: { onSignIn: (loginName: string, p: string) => void; loading: boolean, error: string | null }) => {
    const [loginName, setLoginName] = useState('admin');
    const [password, setPassword] = useState('123123123');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSignIn(loginName, password);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
                        <CardDescription>
                            أدخل اسم الدخول وكلمة المرور للدخول إلى النظام.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="loginName">اسم الدخول</Label>
                            <Input id="loginName" type="text" value={loginName} onChange={e => setLoginName(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <LogIn className="ml-2 h-4 w-4" />}
                            دخول
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
          const usersData = snapshot.val();
          const userEntry = Object.entries(usersData).find(
              ([key, value]: [string, any]) => value.uid === firebaseUser.uid
          );
          
          if (userEntry) {
              const [userKey, userData] = userEntry;
              setUser({ ...(userData as User), id: userKey });
          } else {
            // Temporary fix to allow admin to log in and fix their account
            if (firebaseUser.email === 'admin@admin.com') {
                toast({
                    variant: "destructive",
                    title: "بيانات المستخدم غير مكتملة",
                    description: "يرجى حذف المستخدم 'admin' وإعادة إضافته لتصحيح الربط.",
                });
                setUser({
                    id: 'temp-admin',
                    name: 'المسؤول المؤقت',
                    loginName: 'admin',
                    role: 'مسؤول',
                    warehouse: 'all',
                    uid: firebaseUser.uid
                });
            } else {
              console.error("No user data found in Realtime Database for this auth user.");
              setUser(null);
            }
          }
      } else {
          console.error("No 'users' collection found in Realtime Database.");
          setUser(null);
      }
      setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        fetchUserData(firebaseUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (loginName: string, pass: string): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    try {
        const email = `${loginName}@admin.com`;
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error: any) {
        console.error("Sign in failed:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            setAuthError("اسم الدخول أو كلمة المرور غير صحيحة.");
        } else {
            setAuthError("حدث خطأ أثناء تسجيل الدخول.");
        }
        setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    await firebaseSignOut(auth);
    setUser(null);
  };
  
  if (loading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="mr-2">جارٍ التحميل...</p>
          </div>
      )
  }
  
  if (!user) {
      return <LoginPage onSignIn={signIn} loading={loading} error={authError} />
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, error: authError }}>
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
