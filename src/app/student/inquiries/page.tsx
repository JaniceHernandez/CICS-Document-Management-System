
"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  MessageSquare, 
  Plus, 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  CheckCircle,
  Search,
  Send,
  User,
  ShieldCheck,
  ChevronLeft,
  MessageCircle,
  MoreVertical,
  History
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, addDoc, query, where, orderBy, doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logging';

export default function StudentForum() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  
  // New Inquiry State
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Fetching Public Inquiries (All students see these)
  const inquiriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'inquiries'), orderBy('submissionDate', 'desc'));
  }, [firestore, user]);

  const { data: inquiries, isLoading } = useCollection(inquiriesQuery);

  // Fetching comments for selected inquiry
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedInquiry) return null;
    return query(collection(firestore, 'inquiries', selectedInquiry.id, 'comments'), orderBy('timestamp', 'asc'));
  }, [firestore, selectedInquiry]);

  const { data: comments, isLoading: isCommentsLoading } = useCollection(commentsQuery);

  // Fetching current user profile for comments
  const userProfileRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const filteredInquiries = inquiries?.filter(iq => {
    const matchesSearch = iq.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          iq.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'active' ? iq.status !== 'Resolved' : iq.status === 'Resolved';
    return matchesSearch && matchesStatus;
  });

  const handleSubmitInquiry = async () => {
    if (!firestore || !user || !subject || !message) return;
    setIsSubmitting(true);
    try {
      const inquiryData = {
        studentId: user.uid,
        subject,
        message,
        submissionDate: new Date().toISOString(),
        status: 'Open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(firestore, 'inquiries'), inquiryData);
      logActivity(firestore, user.uid, 'INQUIRY_SUBMITTED' as any, `Started forum discussion: ${subject}`);
      setIsSubmitOpen(false);
      setSubject('');
      setMessage('');
      toast({ title: "Forum Post Created", description: "Your question is now visible to the CICS community." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostComment = async () => {
    if (!firestore || !user || !selectedInquiry || !commentText.trim()) return;
    setIsCommenting(true);
    try {
      const commentData = {
        userId: user.uid,
        userName: profile?.fullName || user.displayName || 'CICS Member',
        userRole: profile?.role || 'Student',
        userPhoto: profile?.photoURL || user.photoURL || null,
        content: commentText,
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(firestore, 'inquiries', selectedInquiry.id, 'comments'), commentData);
      setCommentText('');
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    } finally {
      setIsCommenting(false);
    }
  };

  if (!mounted || isUserLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (selectedInquiry) {
    return (
      <main className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedInquiry(null)}
            className="rounded-full text-muted-foreground hover:text-primary font-bold transition-all -ml-4"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Global Forum
          </Button>

          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary text-white p-10">
              <div className="flex items-center justify-between mb-6">
                <Badge className={cn(
                  "border-none px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest shadow-lg",
                  selectedInquiry.status === 'Resolved' ? "bg-green-500 text-white" : "bg-secondary text-primary"
                )}>
                  {selectedInquiry.status}
                </Badge>
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                  Discussion ID: {selectedInquiry.id.slice(0, 8)}
                </span>
              </div>
              <CardTitle className="text-4xl font-headline font-bold leading-tight">{selectedInquiry.subject}</CardTitle>
              <CardDescription className="text-white/70 text-lg mt-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                  <User className="h-5 w-5 text-white" />
                </div>
                Posted by a CICS Student • {new Date(selectedInquiry.submissionDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-10 space-y-10">
              {/* Original Post */}
              <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 shadow-inner italic text-zinc-800 text-lg leading-relaxed">
                "{selectedInquiry.message}"
              </div>

              {/* Official Admin Resolution */}
              {selectedInquiry.adminResponse && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-primary font-bold uppercase text-xs tracking-widest px-2">
                    <ShieldCheck className="h-5 w-5 text-secondary" />
                    Official Institutional Resolution
                  </div>
                  <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
                    <p className="text-primary font-medium text-lg leading-relaxed">
                      {selectedInquiry.adminResponse}
                    </p>
                    <div className="mt-6 flex items-center gap-3 text-primary/60 text-xs font-bold uppercase tracking-widest">
                      <Sparkles className="h-4 w-4" />
                      Resolved by CICS Administration on {new Date(selectedInquiry.responseDate).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Discussion Thread */}
              <div className="space-y-6 pt-10 border-t border-zinc-100">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-headline font-bold text-xl flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    Community Comments ({comments?.length || 0})
                  </h3>
                </div>

                <div 
                  className="space-y-6 max-h-[500px] overflow-y-auto px-2 pr-4 custom-scrollbar" 
                  ref={scrollRef}
                >
                  {isCommentsLoading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
                  ) : (!comments || comments.length === 0) ? (
                    <div className="text-center py-10 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                      <p className="text-muted-foreground font-medium">No community comments yet. Be the first to help!</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className={cn(
                        "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2",
                        comment.userId === user.uid ? "flex-row-reverse text-right" : ""
                      )}>
                        <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                          <AvatarImage src={comment.userPhoto} />
                          <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
                            {comment.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[80%] space-y-1.5",
                          comment.userId === user.uid ? "items-end" : "items-start"
                        )}>
                          <div className={cn(
                            "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1",
                            comment.userId === user.uid ? "flex-row-reverse" : ""
                          )}>
                            <span className="text-zinc-900">{comment.userName}</span>
                            <span>•</span>
                            <Badge variant="outline" className={cn(
                              "text-[8px] px-1.5 py-0 h-4 border-none",
                              comment.userRole === 'Admin' ? "bg-primary text-white" : "bg-zinc-100 text-zinc-500"
                            )}>
                              {comment.userRole}
                            </Badge>
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                            comment.userId === user.uid 
                              ? "bg-primary text-white rounded-tr-none" 
                              : comment.userRole === 'Admin'
                                ? "bg-primary/5 text-primary border border-primary/10 rounded-tl-none"
                                : "bg-white border border-zinc-100 text-zinc-700 rounded-tl-none"
                          )}>
                            {comment.content}
                          </div>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter px-1">
                            {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-8 bg-zinc-50/50 border-t">
              <div className="w-full flex gap-4">
                <Avatar className="h-12 w-12 border-2 border-white shadow-md shrink-0">
                  <AvatarImage src={profile?.photoURL || undefined} />
                  <AvatarFallback className="bg-primary text-white font-bold">
                    {profile?.fullName?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="relative flex-1">
                  <Textarea 
                    placeholder="Share your thoughts or provide an answer..." 
                    className="min-h-[60px] max-h-[120px] rounded-2xl border-zinc-200 bg-white pr-14 focus-visible:ring-primary shadow-sm resize-none py-3"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment();
                      }
                    }}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-2 bottom-2 h-10 w-10 rounded-xl bg-primary shadow-lg shadow-primary/20"
                    onClick={handlePostComment}
                    disabled={!commentText.trim() || isCommenting}
                  >
                    {isCommenting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight uppercase">CICS Help Forum</h1>
            <p className="text-muted-foreground text-lg">Community-driven discussions and institutional support.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative w-full sm:w-64 order-2 sm:order-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search forum topics..." 
                className="pl-9 h-11 rounded-xl bg-white border-zinc-200 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto order-3 sm:order-2">
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
                <Button className="bg-primary text-white rounded-full h-11 px-8 font-bold shadow-xl shadow-primary/20 order-1 sm:order-3">
                  <Plus className="h-5 w-5 mr-2" />
                  Ask Question
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-[2.5rem] border-none p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-10 bg-primary text-white">
                  <div className="p-3 bg-white/10 w-fit rounded-2xl mb-4">
                    <MessageSquare className="h-8 w-8 text-secondary" />
                  </div>
                  <DialogTitle className="text-3xl font-bold font-headline">Post to Help Forum</DialogTitle>
                  <DialogDescription className="text-white/70 text-base">
                    Your question will be visible to all students and CICS staff.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-10 space-y-8 bg-zinc-50/50">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Subject Header</label>
                    <Input 
                      placeholder="e.g. Guidance on BSIT Capstone Requirements" 
                      className="h-14 rounded-2xl bg-white border-zinc-200 shadow-sm focus-visible:ring-primary"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Detailed Inquiry</label>
                    <Textarea 
                      placeholder="Explain your question in detail so others can help..." 
                      className="min-h-[180px] rounded-2xl bg-white border-zinc-200 shadow-sm focus-visible:ring-primary resize-none p-6"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>
                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
                    <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-blue-900">Community Policy</p>
                      <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        Other students can comment and offer advice. CICS staff will provide official resolutions for critical academic issues.
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter className="p-8 bg-white border-t flex items-center justify-between">
                  <Button variant="ghost" onClick={() => setIsSubmitOpen(false)} className="rounded-xl h-12 px-8 text-zinc-500 font-bold">Cancel</Button>
                  <Button 
                    onClick={handleSubmitInquiry} 
                    disabled={isSubmitting || !subject || !message} 
                    className="bg-primary text-white rounded-xl h-12 px-12 font-bold shadow-xl shadow-primary/20"
                  >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : "Publish Discussion"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Scanning Forum Records...</p>
            </div>
          ) : filteredInquiries?.length === 0 ? (
            <Card className="border-none shadow-sm rounded-[2.5rem] p-32 text-center bg-white">
              <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-8">
                <MessageSquare className="h-12 w-12 text-primary/20" />
              </div>
              <h3 className="text-2xl font-bold font-headline mb-3 text-zinc-900">No {statusFilter} discussions found</h3>
              <p className="text-muted-foreground max-w-md mx-auto text-lg leading-relaxed">
                Be the institutional trailblazer! If you have a question about CICS policies or documents, start a discussion for everyone to see.
              </p>
            </Card>
          ) : (
            filteredInquiries?.map((iq) => (
              <Card 
                key={iq.id} 
                className="border-none shadow-sm rounded-3xl overflow-hidden bg-white hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer group"
                onClick={() => setSelectedInquiry(iq)}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "p-4 rounded-2xl transition-all shadow-sm group-hover:scale-110",
                        iq.status === 'Resolved' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                      )}>
                        {iq.status === 'Resolved' ? <CheckCircle className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{iq.subject}</h3>
                          <Badge variant="secondary" className={cn(
                            "px-3 py-0.5 border-none font-bold uppercase text-[9px] tracking-widest",
                            iq.status === 'Resolved' ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          )}>
                            {iq.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-2 leading-relaxed italic text-sm">
                          "{iq.message}"
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-2">
                          <div className="flex items-center gap-1.5 text-zinc-500">
                            <History className="h-3 w-3" />
                            {new Date(iq.submissionDate).toLocaleDateString()}
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-1.5 text-primary">
                            <MessageCircle className="h-3 w-3" />
                            View Discussion Thread
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="rounded-2xl h-12 px-6 font-bold group-hover:bg-primary group-hover:text-white transition-all shrink-0 self-end md:self-center"
                    >
                      Join Conversation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
