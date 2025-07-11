"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, database } from '@/lib/firebase';
import useFirebase from '@/hooks/use-firebase';
import { Loader2 } from 'lucide-react';
import { ref, set, query, orderByChild, equalTo, get } from 'firebase/database';


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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAppData = useCallback(async (firebaseUser: FirebaseUser) => {
    const usersRef = ref(database, 'users');
    const q = query(usersRef, orderByChild('uid'), equalTo(firebaseUser.uid));
    const snapshot = await get(q);

    if (snapshot.exists()) {
        const userData = snapshot.val();
        const userId = Object.keys(userData)[0];
        setUser({ id: userId, ...userData[userId] });
    } else {
        console.error("User app data not found in Realtime Database.");
        setUser(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserAppData(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserAppData]);
  
  const signIn = async (loginName: string, pass: string) => {
    const usersRef = ref(database, 'users');
    const q = query(usersRef, orderByChild('loginName'), equalTo(loginName));
    const snapshot = await get(q);
    
    if(!snapshot.exists()) {
        throw new Error("اسم الدخول غير صحيح.");
    }

    const userData = snapshot.val();
    const userKey = Object.keys(userData)[0];
    const userEmail = userData[userKey].email; // Assuming you store email

    if (!userEmail) {
        throw new Error("لا يوجد بريد إلكتروني مرتبط بهذا المستخدم.");
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, userEmail, pass);
    await fetchUserAppData(userCredential.user);
  };

  const signOut = async () => {
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

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {user ? children : <LoginPage />}
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

// Simple Login Page Component to be used when user is not authenticated
function LoginPage() {
    const [loginName, setLoginName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signIn } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await signIn(loginName, password);
        } catch (err: any) {
            setError(err.message || 'فشل تسجيل الدخول. يرجى التحقق من اسم الدخول وكلمة المرور.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
                    <CardDescription>
                        أدخل اسم الدخول وكلمة المرور للوصول إلى حسابك.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                        <div className="grid gap-2">
                            <Label htmlFor="loginName">اسم الدخول</Label>
                            <Input
                                id="loginName"
                                type="text"
                                value={loginName}
                                onChange={(e) => setLoginName(e.target.value)}
                                placeholder="اسم المستخدم"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">كلمة المرور</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            تسجيل الدخول
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
