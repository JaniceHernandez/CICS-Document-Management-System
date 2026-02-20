"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldCheck, GraduationCap, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') === 'admin' ? 'admin' : 'student';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = (role: 'student' | 'admin') => {
    setIsLoading(true);
    
    // Simulate domain validation for students
    if (role === 'student') {
      if (!email.endsWith('@neu.edu.ph')) {
        toast({
          title: "Invalid Domain",
          description: "Please use your institutional @neu.edu.ph Google account.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/documents');
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="absolute top-8 left-8 flex items-center text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Link>
      
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary">CICS Docs Hub</h1>
          <p className="text-muted-foreground mt-2 font-body">Secure Portal Authentication</p>
        </div>

        <Tabs defaultValue={defaultRole} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted rounded-xl">
            <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <GraduationCap className="h-4 w-4 mr-2" />
              Student
            </TabsTrigger>
            <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card className="border-none shadow-2xl rounded-2xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-headline font-bold">Student Sign In</CardTitle>
                <CardDescription>
                  Use your institutional Google account (@neu.edu.ph)
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Institutional Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="student.name@neu.edu.ph" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full bg-primary text-white h-12 rounded-xl font-bold" 
                  onClick={() => handleLogin('student')}
                  disabled={isLoading || !email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isLoading ? 'Authenticating...' : 'Sign in with Google'}
                </Button>
              </CardContent>
              <CardFooter className="flex flex-col gap-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Only currently enrolled CICS students can access this portal. Access is automatically revoked upon graduation or blocking.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card className="border-none shadow-2xl rounded-2xl">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-headline font-bold">Admin Portal</CardTitle>
                <CardDescription>
                  Enter your secure credentials to manage the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input id="admin-email" type="email" placeholder="admin@cics.hub" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <Input id="admin-password" type="password" />
                </div>
                <Button 
                  className="w-full bg-zinc-900 text-white h-12 rounded-xl font-bold" 
                  onClick={() => handleLogin('admin')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Accessing Secure Core...' : 'Login to Dashboard'}
                </Button>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground text-center w-full">
                  All administrative actions are logged and subject to periodic audit for accountability.
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}