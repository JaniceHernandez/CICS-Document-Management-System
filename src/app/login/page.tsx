
"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowLeft, Mail, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, initiateGoogleSignIn } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logging';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const targetRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function handleAuthFlow() {
      if (!user || !firestore || isUserLoading) return;

      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        const userData = userSnap.data();

        // 1. Check if account is blocked
        if (userData?.status === 'blocked') {
          toast({
            title: "Account Blocked",
            description: "Your account has been suspended. Please contact CICS administration.",
            variant: "destructive"
          });
          await signOut(auth);
          setIsAuthenticating(false);
          return;
        }

        // 2. Admin Redirection Logic
        if (targetRole === 'admin') {
          const adminRoleRef = doc(firestore, 'adminRoles', user.uid);
          const adminSnap = await getDoc(adminRoleRef);

          // Special handling for master admin if doc doesn't exist yet
          if (!adminSnap.exists() && user.email === 'admin@neu.edu.ph') {
            await setDoc(adminRoleRef, { id: user.uid }, { merge: true });
          }

          const isAdmin = adminSnap.exists() || user.email === 'admin@neu.edu.ph';
          
          if (!isAdmin) {
            toast({
              title: "Unauthorized",
              description: "You do not have administrator privileges.",
              variant: "destructive"
            });
            await signOut(auth);
            setIsAuthenticating(false);
            return;
          }

          // Sync admin profile
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            fullName: user.displayName || 'Administrator',
            role: 'Admin',
            status: 'active',
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          logActivity(firestore, user.uid, 'LOGIN', 'Admin login successful');
          router.push('/admin/dashboard');
          return;
        }

        // 3. Student Redirection Logic
        const userEmail = user.email || '';
        // Allow @neu.edu.ph or development test accounts
        const isAuthorizedDomain = userEmail.endsWith('@neu.edu.ph') || 
                                   userEmail.includes('test') || 
                                   userEmail.includes('neu');

        if (isAuthorizedDomain) {
          if (!userSnap.exists()) {
            // New Student Profile creation
            await setDoc(userDocRef, {
              id: user.uid,
              email: userEmail,
              fullName: user.displayName || 'CICS Student',
              role: 'Student',
              status: 'active',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              programIds: []
            });
          } else {
            // Update existing student profile
            await setDoc(userDocRef, {
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }

          logActivity(firestore, user.uid, 'LOGIN', `Student login successful: ${user.email}`);

          // Check if onboarding is needed (no program assigned)
          const needsOnboarding = !userData?.programIds || userData.programIds.length === 0;
          
          if (needsOnboarding) {
            router.push('/student/onboarding');
          } else {
            router.push('/student/documents');
          }
        } else {
          toast({
            title: "Invalid Domain",
            description: "Students must use an @neu.edu.ph institutional account.",
            variant: "destructive"
          });
          await signOut(auth);
          setIsAuthenticating(false);
        }
      } catch (error: any) {
        console.error("Auth flow error:", error);
        setIsAuthenticating(false);
        toast({
          title: "Session Error",
          description: "Could not verify your institutional profile.",
          variant: "destructive"
        });
      }
    }

    handleAuthFlow();
  }, [user, isUserLoading, firestore, targetRole, router, auth, toast]);

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: "Authentication Failed",
          description: error.message || "Failed to sign in with Google.",
          variant: "destructive"
        });
      }
      setIsAuthenticating(false);
    }
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== 'admin@neu.edu.ph' || password !== 'adminpassword') {
      toast({
        title: "Access Denied",
        description: "Invalid administrator credentials.",
        variant: "destructive"
      });
      return;
    }
    setIsAuthenticating(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createError: any) {
          toast({ title: "Auth Error", description: createError.message, variant: "destructive" });
        }
      } else {
        toast({
          title: "Authentication Error",
          description: error.message || "Failed to log in as administrator.",
          variant: "destructive"
        });
      }
      setIsAuthenticating(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Preparing your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-muted-foreground hover:text-primary transition-colors font-medium">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Link>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 rotate-3">
            <ShieldCheck className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">CICS Hub</h1>
          <p className="text-muted-foreground mt-2 font-body text-lg">Institutional Access Portal</p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="space-y-2 pb-8 pt-10 text-center">
            <CardTitle className="text-2xl font-headline font-bold">
              {targetRole === 'admin' ? 'Admin Portal' : 'Student Access'}
            </CardTitle>
            <CardDescription className="text-base">
              {targetRole === 'admin' 
                ? 'Authorized personnel login only.' 
                : 'Sign in with your @neu.edu.ph account.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 pb-10">
            {targetRole === 'admin' ? (
              <form onSubmit={handleAdminEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Institutional Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="admin@neu.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      disabled={isAuthenticating}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Security Key</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl"
                      disabled={isAuthenticating}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="w-full h-14 rounded-2xl font-bold text-lg"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enter Dashboard'}
                </Button>
              </form>
            ) : (
              <Button 
                className="w-full h-14 rounded-2xl font-bold text-lg" 
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue with Google'}
              </Button>
            )}
          </CardContent>
          
          <CardFooter className="bg-zinc-50/50 p-6 flex justify-center border-t">
            <Link 
              href={`/login?role=${targetRole === 'admin' ? 'student' : 'admin'}`}
              className="text-sm font-bold text-primary hover:underline"
              onClick={() => setIsAuthenticating(false)}
            >
              {targetRole === 'admin' ? 'Switch to Student Access' : 'Switch to Admin Access'}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
