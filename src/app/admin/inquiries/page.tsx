
"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Search, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  MoreHorizontal,
  Reply,
  Loader2,
  Trash2,
  Sparkles,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
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

export default function AdminInquiries() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [response, setResponse] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const inquiriesQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'inquiries') : null, [firestore, adminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);
  
  const { data: inquiries, isLoading } = useCollection(inquiriesQuery);
  const { data: users } = useCollection(usersQuery);

  const filteredInquiries = inquiries?.filter(iq => {
    const matchesSearch = iq.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          iq.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'active') {
      return matchesSearch && iq.status !== 'Resolved';
    } else {
      return matchesSearch && iq.status === 'Resolved';
    }
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

  const handleRespond = () => {
    if (!firestore || !adminUser || !selectedInquiry) return;
    updateDocumentNonBlocking(doc(firestore, 'inquiries', selectedInquiry.id), {
      status: 'Resolved',
      adminId: adminUser.uid,
      adminResponse: response,
      responseDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setSelectedInquiry(null);
    setResponse('');
    setAiSummary('');
  };

  const handleDelete = (id: string) => {
    if (!firestore || !confirm('Delete this inquiry?')) return;
    deleteDocumentNonBlocking(doc(firestore, 'inquiries', id));
  };

  const getStudentName = (sid: string) => users?.find(u => u.id === sid)?.fullName || 'Unknown Student';

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Inquiries</h1>
              <p className="text-muted-foreground">Reply to student questions and requests.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
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
              
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search inquiries..." 
                  className="pl-9 h-11 rounded-xl shadow-sm bg-white border-zinc-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading questions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredInquiries?.length === 0 ? (
                <Card className="border-none shadow-sm rounded-3xl p-20 text-center bg-white">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-zinc-300" />
                  </div>
                  <h3 className="font-bold text-lg">No {statusFilter} inquiries</h3>
                  <p className="text-muted-foreground">All filtered results have been cleared.</p>
                </Card>
              ) : (
                filteredInquiries?.map((iq) => (
                  <Card key={iq.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all bg-white group">
                    <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-xl shrink-0 transition-colors",
                          iq.status === 'Resolved' ? "bg-green-50 group-hover:bg-green-100" : "bg-amber-50 group-hover:bg-amber-100"
                        )}>
                          {iq.status === 'Resolved' ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-amber-600" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{iq.subject}</h3>
                            <Badge variant="secondary" className={cn(
                              "border-none px-2 text-[10px] font-bold uppercase tracking-wider",
                              iq.status === 'Resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {iq.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 italic">"{iq.message}"</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                            <span className="font-bold text-zinc-700">Student: {getStudentName(iq.studentId)}</span>
                            <span>•</span>
                            <span>{new Date(iq.submissionDate).toLocaleDateString()} at {new Date(iq.submissionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl border-zinc-200 h-10 px-6 font-bold hover:bg-zinc-50 transition-all"
                          onClick={() => { setSelectedInquiry(iq); setResponse(iq.adminResponse || ''); setAiSummary(''); }}
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          {iq.status === 'Resolved' ? 'View Transcript' : 'Respond'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:bg-destructive hover:text-white rounded-xl h-10 w-10 transition-all"
                          onClick={() => handleDelete(iq.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
          <DialogContent className="max-w-3xl rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-primary text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl">
                  <MessageSquare className="h-6 w-6 text-secondary" />
                </div>
                <Badge variant="secondary" className="bg-secondary text-primary font-bold border-none uppercase text-[10px] tracking-widest">
                  Status: {selectedInquiry?.status}
                </Badge>
              </div>
              <DialogTitle className="text-3xl font-headline font-bold">{selectedInquiry?.subject}</DialogTitle>
              <DialogDescription className="text-white/70 text-base font-medium">
                Sent by {selectedInquiry && getStudentName(selectedInquiry.studentId)}
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto bg-zinc-50/30">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Student Message</h4>
                <div className="bg-white p-6 rounded-2xl border border-zinc-100 italic leading-relaxed text-zinc-800 shadow-sm">
                  "{selectedInquiry?.message}"
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">AI Content Analysis</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:bg-primary/5 rounded-full h-8 font-bold text-[11px]"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    <Sparkles className="h-3 w-3 mr-2" />
                    {aiSummary ? 'Regenerate' : 'Generate Summary'}
                  </Button>
                </div>
                {isSummarizing ? (
                  <div className="p-6 bg-primary/5 rounded-2xl flex items-center gap-3 border border-primary/10">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <span className="text-sm text-primary font-bold">Processing inquiry...</span>
                  </div>
                ) : aiSummary ? (
                  <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl text-sm text-primary leading-relaxed font-medium">
                    {aiSummary}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Institutional Response</h4>
                <Textarea 
                  placeholder="Compose your reply for the student..." 
                  className="min-h-[150px] rounded-2xl border-zinc-200 focus:ring-primary bg-white shadow-sm resize-none p-4"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  readOnly={selectedInquiry?.status === 'Resolved'}
                />
              </div>
            </div>

            <DialogFooter className="p-8 bg-zinc-50 border-t flex items-center justify-between">
              <Button variant="ghost" onClick={() => setSelectedInquiry(null)} className="rounded-xl h-11 px-6 text-zinc-500 hover:text-zinc-900 font-bold">
                Dismiss
              </Button>
              {selectedInquiry?.status !== 'Resolved' && (
                <Button onClick={handleRespond} disabled={!response.trim()} className="bg-primary text-white rounded-xl h-12 px-10 font-bold shadow-xl shadow-primary/20">
                  Submit Resolution
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
