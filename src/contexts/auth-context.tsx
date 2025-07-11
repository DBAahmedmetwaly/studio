
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Loader2, LogIn } from 'lucide-react';
import { auth, database } from '@/lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut as firebaseSignOut, User as FirebaseUser } from "firebase/auth";
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
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
  uid: string; // Firebase Auth UID
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (loginName: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const LoginPage = ({ onSignIn, loading, error }: { onSignIn: (l: string, p: string) => void; loading: boolean, error: string | null }) => {
    const [loginName, setLoginName] = useState('admin');
    const [password, setPassword] = useState('123123');

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
                            أدخل اسم المستخدم وكلمة المرور للدخول إلى النظام.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="loginName">اسم المستخدم</Label>
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase Auth, now fetch app-specific user data
        const usersRef = ref(database, 'users');
        const userQuery = query(usersRef, orderByChild('loginName'), equalTo(firebaseUser.email?.split('@')[0] || ''));
        const snapshot = await get(userQuery);

        if (snapshot.exists()) {
            const usersData = snapshot.val();
            const userId = Object.keys(usersData)[0];
            const userData = usersData[userId];
            setUser({ ...userData, id: userId, uid: firebaseUser.uid });
        } else {
            // This case should ideally not happen if user creation is handled correctly
            console.error("User exists in Auth but not in Realtime Database.");
            setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }, (error) => {
        console.error("Auth state change error:", error);
        if (error.code === 'auth/configuration-not-found') {
            setAuthError("خدمة المصادقة غير مفعلة في مشروع Firebase. يرجى تفعيلها من لوحة التحكم.");
        } else {
            setAuthError("حدث خطأ أثناء الاتصال بخدمة المصادقة.");
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (loginName: string, pass: string): Promise<void> => {
    setLoading(true);
    setAuthError(null);
    try {
        // We'll use a dummy domain for the email since Firebase Auth requires it.
        const email = `${loginName}@smart-accountant.com`;
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle setting the user state
    } catch (error: any) {
        console.error("Sign in failed:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
            setAuthError("اسم المستخدم أو كلمة المرور غير صحيحة.");
        } else if (error.code === 'auth/configuration-not-found') {
            setAuthError("خدمة المصادقة غير مفعلة في مشروع Firebase. يرجى تفعيلها من لوحة التحكم.");
        }
        else {
            setAuthError("حدث خطأ أثناء تسجيل الدخول.");
        }
        toast({
            variant: "destructive",
            title: "فشل تسجيل الدخول",
            description: authError || "يرجى المحاولة مرة أخرى.",
        });
    } finally {
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
              <p className="mr-2">جارٍ التحقق من تسجيل الدخول...</p>
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
