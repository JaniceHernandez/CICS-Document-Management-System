"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ACADEMIC_PROGRAMS } from '@/lib/constants';

export default function StudentOnboarding() {
  const router = useRouter();
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    if (!firestore || !user || !selectedProgram) return;

    setIsSubmitting(true);
    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        programIds: [selectedProgram],
        updatedAt: new Date().toISOString()
      });

      toast({
        title: "Profile Updated",
        description: "Your academic program has been saved.",
      });

      router.push('/student/documents');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
            <GraduationCap className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">Complete Your Profile</h1>
          <p className="text-muted-foreground text-lg">Select your current undergraduate program to customize your document library.</p>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-primary text-white p-8">
            <CardTitle className="text-xl font-headline">Academic Programs</CardTitle>
            <CardDescription className="text-white/70">
              This helps us filter the right curriculum documents and announcements for you.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACADEMIC_PROGRAMS.map((program) => (
                <div
                  key={program.id}
                  onClick={() => setSelectedProgram(program.id)}
                  className={cn(
                    "relative p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between group min-h-[120px]",
                    selectedProgram === program.id
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-zinc-100 bg-zinc-50 hover:border-primary/30"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider",
                      selectedProgram === program.id ? "bg-primary text-white" : "bg-zinc-200 text-zinc-600"
                    )}>
                      {program.shortCode}
                    </span>
                    {selectedProgram === program.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="font-bold text-zinc-900 group-hover:text-primary transition-colors text-sm mt-4 leading-tight">
                    {program.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="bg-zinc-50 p-8 flex justify-end">
            <Button
              size="lg"
              disabled={!selectedProgram || isSubmitting}
              onClick={handleFinish}
              className="rounded-full px-8 h-12 font-bold shadow-xl shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue to Library
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
