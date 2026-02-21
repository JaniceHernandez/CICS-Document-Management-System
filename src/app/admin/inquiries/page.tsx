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
  Sparkles
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
import { summarizeInquiry } from '@/ai/flows/summarize-inquiry';

export default function AdminInquiries() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [response, setResponse] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const inquiriesQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'inquiries') : null, [firestore, adminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);
  
  const { data: inquiries, isLoading } = useCollection(inquiriesQuery);
  const { data: users } = useCollection(usersQuery);

  const filteredInquiries = inquiries?.filter(iq => 
    iq.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
    iq.message.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.submissionDate).getTime() - new Date(a.submissionDate).getTime());

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
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Inquiries</h1>
              <p className="text-muted-foreground">Reply to student questions and requests.</p>
            </div>
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search inquiries..." 
                className="pl-9 h-11 rounded-xl shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </header>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading questions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredInquiries?.map((iq) => (
                <Card key={iq.id} className="border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-all bg-white">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl shrink-0",
                        iq.status === 'Resolved' ? "bg-green-50" : "bg-amber-50"
                      )}>
                        {iq.status === 'Resolved' ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Clock className="h-6 w-6 text-amber-600" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{iq.subject}</h3>
                          <Badge variant="secondary" className={cn(
                            "border-none px-2 text-[10px] font-bold",
                            iq.status === 'Resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {iq.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">{iq.message}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                          <span className="font-medium text-primary">From: {getStudentName(iq.studentId)}</span>
                          <span>•</span>
                          <span>Submitted: {new Date(iq.submissionDate).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-zinc-200"
                        onClick={() => { setSelectedInquiry(iq); setResponse(iq.adminResponse || ''); setAiSummary(''); }}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        {iq.status === 'Resolved' ? 'View Details' : 'Reply'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive hover:text-white"
                        onClick={() => handleDelete(iq.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
          <DialogContent className="max-w-3xl rounded-3xl border-none p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-primary text-white">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="h-6 w-6 text-secondary" />
                <Badge variant="secondary" className="bg-secondary text-primary font-bold border-none">
                  {selectedInquiry?.status}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-headline font-bold">{selectedInquiry?.subject}</DialogTitle>
              <DialogDescription className="text-white/70">
                Inquiry from {selectedInquiry && getStudentName(selectedInquiry.studentId)}
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Student Message</h4>
                <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 italic leading-relaxed text-zinc-800">
                  "{selectedInquiry?.message}"
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">AI Summary</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:bg-primary/5 rounded-full h-8"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {aiSummary ? 'Regenerate' : 'Summarize'}
                  </Button>
                </div>
                {isSummarizing ? (
                  <div className="p-6 bg-primary/5 rounded-2xl flex items-center gap-3">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    <span className="text-sm text-primary font-medium">Summarizing...</span>
                  </div>
                ) : aiSummary ? (
                  <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl text-sm text-primary leading-relaxed">
                    {aiSummary}
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Your Reply</h4>
                <Textarea 
                  placeholder="Type your response here..." 
                  className="min-h-[150px] rounded-2xl border-zinc-200 focus:ring-primary"
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  readOnly={selectedInquiry?.status === 'Resolved'}
                />
              </div>
            </div>

            <DialogFooter className="p-8 bg-zinc-50 border-t">
              <Button variant="outline" onClick={() => setSelectedInquiry(null)} className="rounded-xl h-11 px-6">
                Close
              </Button>
              {selectedInquiry?.status !== 'Resolved' && (
                <Button onClick={handleRespond} disabled={!response.trim()} className="bg-primary text-white rounded-xl h-11 px-8 font-bold">
                  Send Reply
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
