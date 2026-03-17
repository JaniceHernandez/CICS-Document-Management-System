"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { MessageSquare, Plus, Loader2, Sparkles, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, query, where } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function StudentInquiries() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const inquiriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'inquiries'), where('studentId', '==', user.uid));
  }, [firestore, user]);

  const { data: inquiries, isLoading } = useCollection(inquiriesQuery);

  const filteredInquiries = inquiries?.filter(iq => {
    if (statusFilter === 'active') {
      return iq.status !== 'Resolved';
    } else {
      return iq.status === 'Resolved';
    }
  }).sort((a,b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

  const handleSubmit = async () => {
    if (!firestore || !user || !subject || !message) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'inquiries'), {
        studentId: user.uid,
        subject,
        message,
        submissionDate: new Date().toISOString(),
        status: 'Submitted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsSubmitOpen(false);
      setSubject('');
      setMessage('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center p-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">My Inquiries</h1>
            <p className="text-muted-foreground">Submit and track your support requests.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
              <TabsList className="bg-zinc-100/50 p-1 rounded-xl h-11">
                <TabsTrigger value="active" className="rounded-lg text-xs font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Active
                </TabsTrigger>
                <TabsTrigger value="resolved" className="rounded-lg text-xs font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Resolved
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-white rounded-full h-11 px-6 font-bold shadow-lg shadow-primary/20">
                  <Plus className="h-5 w-5 mr-2" />
                  New Inquiry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-3xl border-none p-0 overflow-hidden">
                <DialogHeader className="p-8 bg-primary text-white">
                  <div className="p-3 bg-white/10 w-fit rounded-2xl mb-4">
                    <MessageSquare className="h-6 w-6 text-secondary" />
                  </div>
                  <DialogTitle className="text-2xl font-bold font-headline">New Academic Inquiry</DialogTitle>
                  <DialogDescription className="text-white/70">
                    Your request will be routed to a CICS administrator for review.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Subject</label>
                    <Input 
                      placeholder="e.g. Question about BSIT Checklist" 
                      className="h-12 rounded-xl border-zinc-200"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-muted-foreground">Detailed Message</label>
                    <Textarea 
                      placeholder="Explain your inquiry in detail..." 
                      className="min-h-[150px] rounded-xl border-zinc-200"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Please note that responses typically take 24-48 hours. Ensure your request is clear for faster resolution.
                    </p>
                  </div>
                </div>
                <DialogFooter className="p-8 bg-zinc-50 border-t">
                  <Button variant="outline" onClick={() => setIsSubmitOpen(false)} className="rounded-xl h-11 px-6">Cancel</Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || !subject || !message} 
                    className="bg-primary text-white rounded-xl h-11 px-8 font-bold"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Inquiry"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          ) : filteredInquiries?.length === 0 ? (
            <Card className="border-none shadow-sm rounded-3xl p-12 text-center bg-white">
              <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-headline mb-2">No {statusFilter} inquiries</h3>
              <p className="text-muted-foreground mb-8">
                {statusFilter === 'active' 
                  ? "Need help with academic documents? Click 'New Inquiry' to start a conversation with CICS Admins."
                  : "You haven't had any inquiries resolved yet."}
              </p>
              {statusFilter === 'active' && (
                <Button variant="outline" className="rounded-full px-8" onClick={() => setIsSubmitOpen(true)}>
                  Create my first inquiry
                </Button>
              )}
            </Card>
          ) : (
            filteredInquiries?.map((iq) => (
              <Card key={iq.id} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl",
                        iq.status === 'Resolved' ? "bg-green-50" : "bg-amber-50"
                      )}>
                        {iq.status === 'Resolved' ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Clock className="h-6 w-6 text-amber-600" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{iq.subject}</h3>
                        <p className="text-xs text-muted-foreground">Submitted: {new Date(iq.submissionDate).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={cn(
                      "px-3 py-1 border-none font-bold",
                      iq.status === 'Resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {iq.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="bg-zinc-50 p-5 rounded-2xl border border-zinc-100 text-sm italic">
                    "{iq.message}"
                  </div>

                  {iq.adminResponse && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                        <div className="p-1 bg-primary/10 rounded-md">
                          <Sparkles className="h-3 w-3 text-primary" />
                        </div>
                        Admin Response
                      </div>
                      <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 text-sm text-primary leading-relaxed shadow-sm">
                        {iq.adminResponse}
                        <p className="mt-4 text-[10px] text-primary/60 font-medium">
                          Resolved on {new Date(iq.responseDate).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}