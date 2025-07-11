
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

const LoginForm = () => {
    const { signIn, error } = useAuth();
    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signIn(loginName, password);
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'فشل تسجيل الدخول',
                description: err.message || 'بيانات الاعتماد غير صحيحة.'
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
                    <CardDescription>أدخل اسم الدخول وكلمة المرور للوصول إلى حسابك.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="loginName">اسم الدخول</Label>
                            <Input id="loginName" type="text" value={loginName} onChange={e => setLoginName(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        {error && <p className="text-destructive text-sm">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                            تسجيل الدخول
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                await fetchUserData(firebaseUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const fetchUserData = async (firebaseUser: FirebaseUser) => {
        setLoading(true);
        const usersRef = ref(database, 'users');
        const q = query(usersRef, orderByChild('uid'), equalTo(firebaseUser.uid));

        try {
            const snapshot = await get(q);
            if (snapshot.exists()) {
                const userData = snapshot.val();
                const userKey = Object.keys(userData)[0];
                setUser({ ...(userData[userKey] as User), id: userKey });
            } else {
                console.error("No user data found in Realtime Database for this auth user.");
                setUser(null);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            setAuthError("Failed to fetch user data.");
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (loginName: string, pass: string) => {
        setLoading(true);
        setAuthError(null);
        try {
            // Firebase Auth requires an email format. We'll append a dummy domain.
            const email = `${loginName}@admin.com`;
            await signInWithEmailAndPassword(auth, email, pass);
            // onAuthStateChanged will handle setting the user
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                 setAuthError('اسم الدخول أو كلمة المرور غير صحيحة.');
            } else {
                setAuthError('حدث خطأ أثناء تسجيل الدخول.');
            }
            setLoading(false);
            throw error; // Re-throw to be caught by the form
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Sign out error", error);
        }
    };

    const value = { user, loading, signIn, signOut, error: authError };

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <AuthContext.Provider value={value}>
            {user ? children : <LoginForm />}
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
