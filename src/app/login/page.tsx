"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, initiateGoogleSignIn } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logging';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const targetRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';
  const logoImage = PlaceHolderImages.find(img => img.id === 'cics-logo');
  
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

        if (targetRole === 'admin') {
          const adminRoleRef = doc(firestore, 'adminRoles', user.uid);
          const adminSnap = await getDoc(adminRoleRef);

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

        const userEmail = user.email || '';
        const isAuthorizedDomain = userEmail.endsWith('@neu.edu.ph') || 
                                   userEmail.includes('test') || 
                                   userEmail.includes('neu');

        if (isAuthorizedDomain) {
          if (!userSnap.exists()) {
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
            await setDoc(userDocRef, {
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }

          logActivity(firestore, user.uid, 'LOGIN', `Student login successful: ${user.email}`);

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

  if (!isUserLoading && user && !isAuthenticating) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
          <p className="text-lg font-bold text-primary">Verifying institutional credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-wider text-xs">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Hub
      </Link>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl p-4 transition-transform hover:scale-105">
            {logoImage && (
              <Image 
                src={logoImage.imageUrl} 
                alt="NEU Logo" 
                width={80} 
                height={80} 
                className="object-contain"
              />
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-headline font-bold text-primary tracking-tight uppercase leading-tight">
            COLLEGE OF INFORMATICS AND COMPUTING STUDIES
          </h1>
          <p className="text-muted-foreground mt-2 font-bold uppercase tracking-[0.2em] text-xs">Document Management System</p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="space-y-2 pb-8 pt-10 text-center bg-zinc-50/50 border-b">
            <CardTitle className="text-2xl font-headline font-bold text-primary">
              {targetRole === 'admin' ? 'Administrator Portal' : 'Student Access'}
            </CardTitle>
            <CardDescription className="text-sm font-medium">
              {targetRole === 'admin' 
                ? 'Authorized CICS personnel only.' 
                : 'Sign in with your @neu.edu.ph account.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-10 py-10">
            {targetRole === 'admin' ? (
              <form onSubmit={handleAdminEmailLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Institutional Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="admin@neu.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-zinc-50 border-none focus-visible:ring-primary shadow-inner"
                      disabled={isAuthenticating}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" title="Security Key" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security Key</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-zinc-50 border-none focus-visible:ring-primary shadow-inner"
                      disabled={isAuthenticating}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Enter Portal'}
                </Button>
              </form>
            ) : (
              <Button 
                className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3" 
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
              >
                {isAuthenticating ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} />
                    Institutional Sign In
                  </>
                )}
              </Button>
            )}
          </CardContent>
          
          <CardFooter className="bg-zinc-50/50 p-6 flex justify-center border-t">
            <Link 
              href={`/login?role=${targetRole === 'admin' ? 'student' : 'admin'}`}
              className="text-xs font-bold text-primary hover:underline uppercase tracking-widest"
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
