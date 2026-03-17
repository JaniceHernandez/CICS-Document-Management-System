"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, deleteDoc, limit } from 'firebase/firestore';
import { deleteFromBlob } from '@/app/actions/storage';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { 
  Loader2, 
  Plus,
  FileText, 
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle,
  Clock,
  Inbox
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { SubmitDocumentDialog } from '@/components/student/submit-document-dialog';
import { cn } from '@/lib/utils';
import { DOCUMENT_CATEGORIES, getCategoryName } from '@/lib/constants';

export default function StudentSubmitPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);

  // Edit State
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCatId, setEditCatId] = useState('');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const mySubmissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'documents'), 
      where('uploaderId', '==', user.uid),
      limit(100)
    );
  }, [firestore, user]);

  const { data: documents, isLoading: submissionsLoading } = useCollection(mySubmissionsQuery);

  const submissions = documents?.filter(doc => {
    return doc.type === 'submission' || doc.fileUrl?.includes('student-submissions');
  }) || [];

  const handleEdit = (docData: any) => {
    setEditingDoc(docData);
    setEditTitle(docData.title);
    setEditDesc(docData.description || '');
    setEditCatId(docData.categoryId);
  };

  const saveEdit = () => {
    if (!firestore || !user || !editingDoc) return;
    updateDocumentNonBlocking(doc(firestore, 'documents', editingDoc.id), {
      title: editTitle,
      description: editDesc,
      categoryId: editCatId,
      updatedAt: new Date().toISOString()
    });
    logActivity(firestore, user.uid, 'DOCUMENT_EDIT', `Updated metadata for submission: ${editTitle}`, editingDoc.id);
    setEditingDoc(null);
    toast({ title: "Submission Updated" });
  };

  const handleDelete = async (docData: any) => {
    if (!firestore || !user) return;
    if (confirm(`Are you sure you want to remove "${docData.title}"? This will withdraw the document from institutional review.`)) {
      try {
        await deleteDoc(doc(firestore, 'documents', docData.id));
        if (docData.fileUrl) {
          await deleteFromBlob(docData.fileUrl);
        }
        logActivity(firestore, user.uid, 'DOCUMENT_DELETE', `Withdrew submission: ${docData.title}`, docData.id);
        toast({ title: "Submission Withdrawn" });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Action Failed", description: e.message });
      }
    }
  };

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="student" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary tracking-tight uppercase">My Submissions</h1>
              <p className="text-muted-foreground text-lg">Upload and monitor your required institutional documents.</p>
            </div>
            <Button 
              onClick={() => setIsSubmitDialogOpen(true)}
              className="bg-primary text-white hover:bg-primary/90 rounded-full h-12 px-8 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Submission
            </Button>
          </header>

          <section className="space-y-6">
            <div className="flex items-center gap-2 text-primary">
              <Inbox className="h-5 w-5" />
              <h2 className="text-xl font-headline font-bold">Requirement Filing Ledger</h2>
            </div>
            
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-none">
                    <TableHead className="font-bold px-8 py-5 text-[10px] uppercase tracking-widest">Document Details</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Filing Status</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date Filed</TableHead>
                    <TableHead className="font-bold text-right px-8 text-[10px] uppercase tracking-widest">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/40" />
                        <p className="mt-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">Retrieving your filings...</p>
                      </TableCell>
                    </TableRow>
                  ) : submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-muted-foreground font-medium">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        No personal documents filed yet. Use 'New Submission' to start.
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.sort((a,b) => new Date(b.uploadDate || b.createdAt || 0).getTime() - new Date(a.uploadDate || a.createdAt || 0).getTime()).map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary/40">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-800 leading-tight">{sub.title}</p>
                              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                {getCategoryName(sub.categoryId)} • {sub.fileSize ? (sub.fileSize / 1024 / 1024).toFixed(2) : '0.00'} MB
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(
                            "border-none font-bold text-[9px] px-2.5 py-1 uppercase tracking-wider flex items-center gap-1.5 w-fit",
                            sub.status === 'Acknowledged' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {sub.status === 'Acknowledged' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {sub.status || 'Pending Review'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-zinc-500">
                          {new Date(sub.uploadDate || sub.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-xl h-9 w-9 text-zinc-400 hover:text-primary hover:bg-primary/5"
                              title="Edit Details"
                              onClick={() => handleEdit(sub)}
                              disabled={sub.status === 'Acknowledged'}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-xl h-9 w-9 text-zinc-400 hover:text-destructive hover:bg-destructive/5"
                              title="Withdraw Submission"
                              onClick={() => handleDelete(sub)}
                              disabled={sub.status === 'Acknowledged'}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5" title="Preview File">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </section>
        </div>

        <SubmitDocumentDialog 
          open={isSubmitDialogOpen} 
          onOpenChange={setIsSubmitDialogOpen} 
        />

        <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
          <DialogContent className="max-w-xl rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-primary text-white">
              <DialogTitle className="text-2xl font-bold font-headline uppercase tracking-tight">Update Filing Details</DialogTitle>
              <DialogDescription className="text-white/70">Modify metadata for your submitted requirement.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Document Title</Label>
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-12 rounded-xl focus-visible:ring-primary shadow-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Requirement Category</Label>
                <Select value={editCatId} onValueChange={setEditCatId}>
                  <SelectTrigger className="h-12 rounded-xl shadow-sm">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Submission Notes</Label>
                <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Provide any context for the administrator..." className="min-h-[120px] rounded-xl resize-none shadow-sm" />
              </div>
            </div>
            <DialogFooter className="p-8 bg-zinc-50 border-t flex items-center justify-between">
              <Button variant="ghost" onClick={() => setEditingDoc(null)} className="rounded-xl px-6 font-bold text-zinc-500">Cancel</Button>
              <Button onClick={saveEdit} className="bg-primary text-white rounded-xl px-8 font-bold shadow-lg shadow-primary/20">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
