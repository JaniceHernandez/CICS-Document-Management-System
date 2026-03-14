
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, Loader2, Lock, ShieldCheck, GraduationCap, Globe } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirebase, useUser, initiateGoogleSignIn } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logging';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

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
            description: "Your institutional account access has been suspended.",
            variant: "destructive"
          });
          await signOut(auth);
          setIsAuthenticating(false);
          return;
        }

        if (targetRole === 'admin') {
          const adminRoleRef = doc(firestore, 'adminRoles', user.uid);
          const adminSnap = await getDoc(adminRoleRef);

          // Default bootstrap for initial admin setup (legacy support)
          if (!adminSnap.exists() && user.email === 'admin@neu.edu.ph') {
            await setDoc(adminRoleRef, { id: user.uid }, { merge: true });
          }

          const isAdmin = adminSnap.exists() || user.email === 'admin@neu.edu.ph';
          
          if (!isAdmin) {
            toast({
              title: "Unauthorized Access",
              description: "This account does not have administrative clearance.",
              variant: "destructive"
            });
            await signOut(auth);
            setIsAuthenticating(false);
            return;
          }

          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            fullName: user.displayName || userData?.fullName || 'Institutional Administrator',
            role: 'Admin',
            status: 'active',
            lastLoginAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }, { merge: true });
          
          logActivity(firestore, user.uid, 'LOGIN', 'Administrative session established');
          router.push('/admin/dashboard');
          return;
        }

        const userEmail = user.email || '';
        const isAuthorizedDomain = userEmail.endsWith('@neu.edu.ph') || 
                                   userEmail.includes('test') || 
                                   userEmail.includes('neu');

        if (isAuthorizedDomain) {
          const existingRole = userData?.role || 'Student';
          
          if (!userSnap.exists()) {
            await setDoc(userDocRef, {
              id: user.uid,
              email: userEmail,
              fullName: user.displayName || 'Institutional Student',
              role: 'Student',
              status: 'active',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              programIds: []
            });
          } else {
            await setDoc(userDocRef, {
              fullName: user.displayName || userData?.fullName || 'Institutional Student',
              lastLoginAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }

          logActivity(firestore, user.uid, 'LOGIN', `Student session synchronized: ${user.email}`);

          const needsOnboarding = !userData?.programIds || userData.programIds.length === 0;
          
          if (needsOnboarding) {
            router.push('/student/onboarding');
          } else {
            router.push('/student/documents');
          }
        } else {
          toast({
            title: "Access Denied",
            description: "Students must authenticate with their @neu.edu.ph account.",
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
          description: "Could not synchronize your institutional profile.",
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
          description: error.message || "Institutional sign-in failed.",
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
        description: "Invalid institutional administrator credentials.",
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
          <p className="text-xl font-headline font-bold text-primary animate-pulse tracking-tight uppercase">Synchronizing Credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#003366_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <Link href="/" className="absolute top-8 left-8 flex items-center text-zinc-500 hover:text-primary transition-all font-bold uppercase tracking-widest text-[10px] z-10 group">
        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
          <ArrowLeft className="h-4 w-4" />
        </div>
        Return to Portal Hub
      </Link>
      
      <div className="w-full max-w-lg space-y-10 relative z-10">
        <div className="text-center space-y-6">
          <div className="mx-auto w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl p-5 border border-zinc-100 transition-all hover:rotate-3 hover:scale-105">
            {logoImage && (
              <Image 
                src={logoImage.imageUrl} 
                alt="NEU Logo" 
                width={100} 
                height={100} 
                className="object-contain"
              />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-headline font-bold text-primary tracking-tight uppercase leading-none">
              Institutional Gateway
            </h1>
            <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px]">CICS Document Management System</p>
          </div>
        </div>

        <Card className="border-none shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="space-y-2 p-10 pb-8 text-center bg-zinc-50/50 border-b relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1 bg-primary text-white rounded-full text-[9px] font-bold uppercase tracking-widest shadow-xl">
              Official Entrance
            </div>
            <CardTitle className="text-3xl font-headline font-bold text-primary flex items-center justify-center gap-3">
              {targetRole === 'admin' ? (
                <><ShieldCheck className="h-7 w-7 text-secondary" /> Staff Portal</>
              ) : (
                <><GraduationCap className="h-7 w-7 text-secondary" /> Student Portal</>
              )}
            </CardTitle>
            <CardDescription className="text-base font-medium text-zinc-500">
              {targetRole === 'admin' 
                ? 'Authorized institutional staff only.' 
                : 'Authenticate with your NEU Google account.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-10 space-y-8">
            {targetRole === 'admin' ? (
              <form onSubmit={handleAdminEmailLogin} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Staff ID</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="email"
                      type="email"
                      placeholder="admin@neu.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 rounded-2xl bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner text-base font-medium"
                      disabled={isAuthenticating}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="password" title="Security Key" className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 ml-1">Access Key</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-14 rounded-2xl bg-zinc-50 border-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner text-base font-medium"
                      disabled={isAuthenticating}
                      required
                    />
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="w-full h-16 rounded-[1.25rem] font-bold text-lg shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Authorize Access'}
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <Button 
                  variant="outline"
                  className="w-full h-16 rounded-[1.25rem] font-bold text-lg border-2 border-zinc-100 hover:bg-zinc-50 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95" 
                  onClick={handleGoogleLogin}
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                    <>
                      <Image src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={24} height={24} />
                      Sign in with Institutional Account
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-4 py-2">
                  <div className="h-px bg-zinc-100 flex-1" />
                  <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest text-center px-4">Institutional SSO</span>
                  <div className="h-px bg-zinc-100 flex-1" />
                </div>
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-4">
                  <Globe className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-xs text-blue-700 font-medium leading-relaxed">
                    Student access is strictly limited to verified @neu.edu.ph domain profiles.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-zinc-50/50 p-8 flex justify-center border-t">
            <Link 
              href={`/login?role=${targetRole === 'admin' ? 'student' : 'admin'}`}
              className="text-[11px] font-bold text-primary hover:underline uppercase tracking-[0.2em] flex items-center gap-2 transition-all hover:gap-3"
              onClick={() => setIsAuthenticating(false)}
            >
              {targetRole === 'admin' ? (
                <>Switch to Student Access <ArrowLeft className="h-3 w-3 rotate-180" /></>
              ) : (
                <>Switch to Staff Access <ArrowLeft className="h-3 w-3 rotate-180" /></>
              )}
            </Link>
          </CardFooter>
        </Card>
        
        <p className="text-center text-zinc-400 text-[9px] font-bold uppercase tracking-widest pb-10">
          © 2024 New Era University • College of Informatics and Computing Studies
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
