"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, GraduationCap, ArrowLeft, Mail, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, initiateGoogleSignIn } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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
      if (user && firestore) {
        const userEmail = user.email || '';
        
        if (targetRole === 'admin') {
          const adminRoleRef = doc(firestore, 'adminRoles', user.uid);
          const adminSnap = await getDoc(adminRoleRef);

          // In this prototype, we provision adminRole if they logged in via the admin portal with valid credentials
          if (!adminSnap.exists()) {
             setDocumentNonBlocking(adminRoleRef, { id: user.uid }, { merge: true });
          }

          setDocumentNonBlocking(doc(firestore, 'users', user.uid), {
            id: user.uid,
            email: userEmail,
            fullName: user.displayName || 'Administrator',
            role: 'Admin',
            status: 'active',
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          router.push('/admin/dashboard');
        } else {
          // Student Flow
          if (userEmail.endsWith('@neu.edu.ph')) {
            const userProfileRef = doc(firestore, 'users', user.uid);
            
            setDocumentNonBlocking(userProfileRef, {
              id: user.uid,
              email: userEmail,
              fullName: user.displayName || 'CICS Student',
              role: 'Student',
              status: 'active',
              lastLoginAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
            
            router.push('/student/documents');
          } else {
            toast({
              title: "Invalid Domain",
              description: "Students must use an @neu.edu.ph institutional account.",
              variant: "destructive"
            });
            await auth.signOut();
            setIsAuthenticating(false);
          }
        }
      }
    }

    handleAuthFlow();
  }, [user, firestore, targetRole, router, auth, toast]);

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      // Don't show an error toast if the user simply closed the popup
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: "Authentication Failed",
          description: error.message || "Failed to sign in with Google.",
          variant: "destructive"
        });
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict requirement for prototype admin credentials
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
      // Attempt to sign in
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInError: any) {
        // If user not found, create it for the prototype
        if (signInError.code === 'auth/user-not-found') {
          await createUserWithEmailAndPassword(auth, email, password);
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Failed to log in as administrator.",
        variant: "destructive"
      });
      setIsAuthenticating(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-muted-foreground hover:text-primary transition-colors font-medium">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/20 rotate-3">
            <ShieldCheck className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">CICS Docs Hub</h1>
          <p className="text-muted-foreground mt-2 font-body text-lg">Secure Institutional Access</p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="space-y-2 pb-8 pt-10 text-center">
            <div className="flex justify-center mb-4">
              {targetRole === 'admin' ? (
                <div className="p-3 bg-zinc-900 rounded-2xl text-white">
                  <ShieldCheck className="h-8 w-8" />
                </div>
              ) : (
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  < GraduationCap className="h-8 w-8" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl font-headline font-bold">
              {targetRole === 'admin' ? 'Admin Portal' : 'Student Access'}
            </CardTitle>
            <CardDescription className="text-base">
              {targetRole === 'admin' 
                ? 'Authorized personnel only. Enter admin credentials.' 
                : 'Sign in with your @neu.edu.ph account.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 pb-10">
            {targetRole === 'admin' ? (
              <form onSubmit={handleAdminEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Admin Email</Label>
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
                  <Label htmlFor="password">Password</Label>
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
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Enter Dashboard'
                  )}
                </Button>
              </form>
            ) : (
              <Button 
                className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98]" 
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Mail className="h-5 w-5 mr-3" />
                    Continue with Google
                  </>
                )}
              </Button>
            )}
          </CardContent>
          
          <CardFooter className="bg-zinc-50/50 p-6 flex justify-center border-t">
            <Link 
              href={`/login?role=${targetRole === 'admin' ? 'student' : 'admin'}`}
              className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
            >
              {targetRole === 'admin' ? 'Switch to Student Login' : 'Switch to Admin Login'}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
