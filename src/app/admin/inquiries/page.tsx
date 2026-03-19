
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Reply,
  Loader2,
  Trash2,
  Sparkles,
  User,
  ShieldCheck,
  Send,
  MessageCircle,
  History,
  ChevronLeft
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, orderBy, addDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { summarizeInquiry } from '@/ai/flows/summarize-inquiry';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/lib/activity-logging';

export default function AdminForumManagement() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  
  // Resolution State
  const [resolution, setResolution] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  // Comment State
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inquiriesQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'inquiries') : null, [firestore, adminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);
  
  const { data: inquiries, isLoading } = useCollection(inquiriesQuery);
  const { data: users } = useCollection(usersQuery);

  // Fetching comments for selected inquiry
  const commentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedInquiry) return null;
    return query(collection(firestore, 'inquiries', selectedInquiry.id, 'comments'), orderBy('timestamp', 'asc'));
  }, [firestore, selectedInquiry]);

  const { data: comments, isLoading: isCommentsLoading } = useCollection(commentsQuery);

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
  }).sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

  const handleSummarize = async () => {
    if (!selectedInquiry) return;
    setIsSummarizing(true);
    try {
      const result = await summarizeInquiry(selectedInquiry.message);
      setAiSummary(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleResolve = () => {
    if (!firestore || !adminUser || !selectedInquiry) return;
    updateDocumentNonBlocking(doc(firestore, 'inquiries', selectedInquiry.id), {
      status: 'Resolved',
      adminId: adminUser.uid,
      adminResponse: resolution,
      responseDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    logActivity(firestore, adminUser.uid, 'DOCUMENT_EDIT' as any, `Resolved forum inquiry: ${selectedInquiry.subject}`);
    toast({ title: "Topic Resolved", description: "Official resolution published to the forum." });
    setSelectedInquiry(null);
    setResolution('');
    setAiSummary('');
  };

  const handlePostComment = async () => {
    if (!firestore || !adminUser || !selectedInquiry || !commentText.trim()) return;
    setIsCommenting(true);
    try {
      const commentData = {
        userId: adminUser.uid,
        userName: adminUser.displayName || 'Institutional Admin',
        userRole: 'Admin',
        userPhoto: adminUser.photoURL || null,
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

  const handleDelete = (id: string) => {
    if (!firestore || !confirm('Permanently delete this discussion?')) return;
    deleteDocumentNonBlocking(doc(firestore, 'inquiries', id));
    toast({ title: "Topic Removed" });
  };

  const getStudentProfile = (sid: string) => users?.find(u => u.id === sid);

  if (!mounted) return null;

  if (selectedInquiry) {
    const poster = getStudentProfile(selectedInquiry.studentId);
    return (
      <main className="p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedInquiry(null)}
            className="rounded-full text-muted-foreground hover:text-primary font-bold transition-all -ml-4"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Thread Registry
          </Button>

          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary text-white p-10">
              <div className="flex items-center justify-between mb-6">
                <Badge className={cn(
                  "border-none px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest shadow-lg",
                  selectedInquiry.status === 'Resolved' ? "bg-green-500 text-white" : "bg-secondary text-primary"
                )}>
                  {selectedInquiry.status}
                </Badge>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-white hover:bg-white/10 rounded-full h-8 font-bold text-[10px]"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    {aiSummary ? 'Regenerate Analysis' : 'Analyze Content'}
                  </Button>
                </div>
              </div>
              <CardTitle className="text-4xl font-headline font-bold leading-tight">{selectedInquiry.subject}</CardTitle>
              <CardDescription className="text-white/70 text-lg mt-4 flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/20">
                  <AvatarImage src={poster?.photoURL} />
                  <AvatarFallback className="bg-white/10 text-white text-xs font-bold">{poster?.fullName?.charAt(0) || 'S'}</AvatarFallback>
                </Avatar>
                Posted by {poster?.fullName || 'Anonymous Student'} • {new Date(selectedInquiry.submissionDate).toLocaleDateString()}
              </CardDescription>
            </CardHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2 p-10 space-y-8 border-r border-zinc-50">
                <div className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 italic text-zinc-800 text-lg leading-relaxed shadow-inner">
                  "{selectedInquiry.message}"
                </div>

                {aiSummary && (
                  <div className="bg-secondary/5 border border-secondary/20 p-6 rounded-2xl relative">
                    <div className="absolute top-4 right-4"><Sparkles className="h-4 w-4 text-secondary" /></div>
                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-2">AI Summary</h4>
                    <p className="text-sm text-zinc-700 leading-relaxed font-medium">{aiSummary}</p>
                  </div>
                )}

                {/* Thread */}
                <div className="space-y-6 pt-6">
                  <h3 className="font-headline font-bold text-xl flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                    Thread History
                  </h3>
                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar" ref={scrollRef}>
                    {comments?.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-4">
                        <Avatar className="h-9 w-9 border shadow-sm">
                          <AvatarImage src={comment.userPhoto} />
                          <AvatarFallback className="bg-zinc-100 text-zinc-500 font-bold text-[10px]">
                            {comment.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-900">{comment.userName}</span>
                              <Badge variant="outline" className={cn(
                                "text-[8px] h-4 px-1 border-none",
                                comment.userRole === 'Admin' ? "bg-primary text-white" : "bg-zinc-100 text-zinc-500"
                              )}>
                                {comment.userRole}
                              </Badge>
                            </div>
                            <span className="text-[9px] font-bold text-zinc-400">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm border",
                            comment.userRole === 'Admin' ? "bg-primary/5 text-primary border-primary/10" : "bg-white border-zinc-100 text-zinc-700"
                          )}>
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t flex gap-4">
                  <Avatar className="h-10 w-10 border shadow-md shrink-0">
                    <AvatarImage src={adminUser?.photoURL || undefined} />
                    <AvatarFallback className="bg-primary text-white font-bold">{adminUser?.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="relative flex-1">
                    <Textarea 
                      placeholder="Type a community response..." 
                      className="min-h-[50px] rounded-2xl pr-14 focus-visible:ring-primary shadow-sm resize-none"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <Button 
                      size="icon" 
                      className="absolute right-2 bottom-2 h-8 w-8 rounded-xl"
                      onClick={handlePostComment}
                      disabled={!commentText.trim() || isCommenting}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-zinc-50/50 space-y-10">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 flex items-center justify-between">
                    Official Resolution
                    {selectedInquiry.status === 'Resolved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </h4>
                  <Textarea 
                    placeholder="Provide the definitive institutional answer here..." 
                    className="min-h-[250px] rounded-[2rem] border-zinc-200 focus:ring-primary bg-white shadow-xl resize-none p-8 text-lg"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    readOnly={selectedInquiry.status === 'Resolved'}
                  />
                  {selectedInquiry.status !== 'Resolved' ? (
                    <Button 
                      onClick={handleResolve} 
                      disabled={!resolution.trim()} 
                      className="w-full bg-primary text-white rounded-2xl h-14 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                    >
                      Publish Official Resolution
                    </Button>
                  ) : (
                    <div className="p-6 bg-green-100 rounded-3xl border border-green-200 text-center">
                      <p className="text-green-800 font-bold text-sm">Issue marked as Resolved</p>
                      <p className="text-green-600 text-xs font-medium mt-1">Resolution is live on the public forum.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-zinc-200">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Management</h4>
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:bg-destructive hover:text-white rounded-2xl h-12 font-bold justify-start px-6"
                    onClick={() => handleDelete(selectedInquiry.id)}
                  >
                    <Trash2 className="h-5 w-5 mr-3" />
                    Delete Topic Permanently
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight uppercase">Forum Moderation</h1>
            <p className="text-muted-foreground text-lg">Oversee community discussions and provide institutional guidance.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
              <TabsList className="bg-zinc-100/50 p-1 rounded-xl h-11">
                <TabsTrigger value="active" className="rounded-lg text-xs font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Ongoing Discussions
                </TabsTrigger>
                <TabsTrigger value="resolved" className="rounded-lg text-xs font-bold px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Resolved Topics
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search forum records..." 
                className="pl-9 h-11 rounded-xl shadow-sm bg-white border-zinc-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Accessing Forum Ledger...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredInquiries?.length === 0 ? (
              <Card className="border-none shadow-sm rounded-[2.5rem] p-32 text-center bg-white">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-zinc-300" />
                </div>
                <h3 className="font-bold text-2xl text-zinc-900">No {statusFilter} topics</h3>
                <p className="text-muted-foreground text-lg">All community inquiries have been moderated.</p>
              </Card>
            ) : (
              filteredInquiries?.map((iq) => (
                <Card 
                  key={iq.id} 
                  className="border-none shadow-sm rounded-3xl overflow-hidden hover:shadow-xl hover:translate-y-[-2px] transition-all bg-white group cursor-pointer"
                  onClick={() => { setSelectedInquiry(iq); setResolution(iq.adminResponse || ''); setAiSummary(''); }}
                >
                  <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "p-4 rounded-2xl shrink-0 transition-all group-hover:scale-110",
                        iq.status === 'Resolved' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                      )}>
                        {iq.status === 'Resolved' ? <CheckCircle className="h-8 w-8" /> : <Clock className="h-8 w-8" />}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-xl group-hover:text-primary transition-colors">{iq.subject}</h3>
                          <Badge variant="secondary" className={cn(
                            "border-none px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm",
                            iq.status === 'Resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {iq.status}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground line-clamp-1 italic text-sm">"{iq.message}"</p>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-2">
                          <span className="flex items-center gap-1.5 text-zinc-700">
                            <User className="h-3 w-3" />
                            {getStudentProfile(iq.studentId)?.fullName || 'Anonymous'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <History className="h-3 w-3" />
                            {new Date(iq.submissionDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-zinc-200 h-11 px-8 font-bold hover:bg-primary hover:text-white transition-all"
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        {iq.status === 'Resolved' ? 'View Discussion' : 'Moderator Actions'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive hover:text-white rounded-xl h-11 w-11 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleDelete(iq.id); }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
