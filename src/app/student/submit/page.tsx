"use client";

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
import { collection, doc, query, where, deleteDoc } from 'firebase/firestore';
import { uploadToBlob, deleteFromBlob } from '@/app/actions/storage';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { 
  Loader2, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Users, 
  ShieldCheck, 
  Info,
  Trash2,
  Edit,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function StudentSubmitPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);

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

  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const mySubmissionsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'documents'), where('uploaderId', '==', user.uid));
  }, [firestore, user]);

  const { data: categories } = useCollection(categoriesQuery);
  const { data: submissions, isLoading: submissionsLoading } = useCollection(mySubmissionsQuery);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setFile(null);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast({ variant: "destructive", title: "Invalid File Type", description: "Only PDF documents are supported." });
      }
    }
  }, [toast]);

  const handleSubmit = async () => {
    if (!firestore || !user || !file || !categoryId) return;
    setLoading(true);

    try {
      const docId = doc(collection(firestore, 'documents')).id;
      const now = new Date().toISOString();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', `student-submissions/${docId}-${file.name}`);
      
      const fileUrl = await uploadToBlob(formData);

      const docData = {
        id: docId,
        title,
        description,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: now,
        uploaderId: user.uid,
        categoryId,
        programIds: [], // Defaults to Global, admins can re-assign
        downloadCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      setDocumentNonBlocking(doc(firestore, 'documents', docId), docData, { merge: true });
      logActivity(firestore, user.uid, 'DOCUMENT_UPLOAD', `Student submitted resource: ${title}`, docId);
      
      toast({ 
        title: "Submission Successful", 
        description: "Your document has been sent to the administrators." 
      });

      resetForm();
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Submission Failed", 
        description: error.message || "Failed to upload your document." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doc: any) => {
    setEditingDoc(doc);
    setEditTitle(doc.title);
    setEditDesc(doc.description);
    setEditCatId(doc.categoryId);
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
    if (confirm(`Are you sure you want to delete "${docData.title}"?`)) {
      try {
        await deleteDoc(doc(firestore, 'documents', docData.id));
        if (docData.fileUrl) {
          await deleteFromBlob(docData.fileUrl);
        }
        logActivity(firestore, user.uid, 'DOCUMENT_DELETE', `Deleted personal submission: ${docData.title}`, docData.id);
        toast({ title: "Submission Removed" });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Error", description: e.message });
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
        <div className="max-w-5xl mx-auto space-y-12">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">Institutional Document Management</h1>
            <p className="text-muted-foreground text-lg">Submit academic resources and manage your uploaded materials.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-zinc-50">
                  <CardTitle className="font-headline font-bold text-xl flex items-center gap-3 text-primary">
                    <Upload className="h-6 w-6" />
                    New Submission
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PDF Attachment</Label>
                    <div 
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={cn(
                        "relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 group",
                        dragActive ? "border-primary bg-primary/5 scale-[0.98]" : "border-zinc-200 bg-white hover:border-primary/50",
                        file ? "border-green-500 bg-green-50/30" : ""
                      )}
                    >
                      <input 
                        type="file" 
                        id="student-file-upload" 
                        className="hidden" 
                        accept=".pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                      <div className="flex flex-col items-center space-y-4">
                        {file ? (
                          <div className="bg-green-500 p-4 rounded-2xl shadow-lg shadow-green-500/20 text-white">
                            <CheckCircle2 className="h-8 w-8" />
                          </div>
                        ) : (
                          <div className="bg-zinc-100 p-4 rounded-2xl text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <Upload className="h-8 w-8" />
                          </div>
                        )}
                        
                        <div>
                          <p className="font-bold text-xl text-zinc-900">
                            {file ? file.name : 'Choose a PDF file'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop or click to browse'}
                          </p>
                        </div>

                        {!file && (
                          <Button 
                            variant="outline" 
                            className="rounded-full px-8 h-11 border-zinc-200"
                            onClick={() => document.getElementById('student-file-upload')?.click()}
                          >
                            Browse Files
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resource Title</Label>
                      <Input 
                        id="title" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        placeholder="e.g. Laboratory Report - Group 5"
                        className="h-12 rounded-2xl bg-zinc-50 border-none shadow-inner focus-visible:ring-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</Label>
                      <Select value={categoryId} onValueChange={setCategoryId}>
                        <SelectTrigger className="h-12 rounded-2xl bg-zinc-50 border-none shadow-inner">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id} className="rounded-xl my-1">{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Description / Abstract</Label>
                      <Textarea 
                        id="description" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Provide a brief context for this document..."
                        className="min-h-[120px] rounded-2xl bg-zinc-50 border-none shadow-inner p-6 resize-none focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 bg-zinc-50/50 border-t flex justify-end">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={loading || !title || !file || !categoryId}
                    className="bg-primary text-white rounded-2xl h-14 px-12 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-3" />
                        Submit for Review
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-3xl bg-primary text-white overflow-hidden">
                <CardHeader className="p-8">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <Info className="h-6 w-6 text-secondary" />
                  </div>
                  <CardTitle className="font-headline font-bold text-xl">Submission Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-4">
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">Only high-quality <strong>PDF</strong> documents are accepted for institutional storage.</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Users className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">All submissions are reviewed by the CICS administration before general release.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100 space-y-4">
                <div className="flex items-center gap-3 text-primary font-bold">
                  <ShieldCheck className="h-5 w-5" />
                  Audit Trail
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every submission is logged with your institutional ID. Misuse or unauthorized uploads will be subject to university policy.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-headline font-bold text-primary">Monitoring My Uploads</h2>
              <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                {submissions?.length || 0} TOTAL SUBMISSIONS
              </Badge>
            </div>
            
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-none">
                    <TableHead className="font-bold px-8 py-5 text-[10px] uppercase tracking-widest">Document Title</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date Submitted</TableHead>
                    <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                    <TableHead className="font-bold text-right px-8 text-[10px] uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                      </TableCell>
                    </TableRow>
                  ) : submissions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        You haven't submitted any documents yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions?.sort((a,b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()).map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                        <TableCell className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary/40" />
                            <span className="font-bold text-zinc-800">{sub.title}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-zinc-500">
                          {new Date(sub.uploadDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-blue-100 text-blue-700 border-none text-[9px] font-bold uppercase tracking-widest px-3">
                            PENDING REVIEW
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-xl h-9 w-9 text-zinc-400 hover:text-primary hover:bg-primary/5"
                              onClick={() => handleEdit(sub)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-xl h-9 w-9 text-zinc-400 hover:text-destructive hover:bg-destructive/5"
                              onClick={() => handleDelete(sub)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <a 
                              href={`/api/blob?url=${encodeURIComponent(sub.fileUrl)}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/5"
                            >
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

        {/* Edit Dialog */}
        <Dialog open={!!editingDoc} onOpenChange={(open) => !open && setEditingDoc(null)}>
          <DialogContent className="max-w-xl rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-primary text-white">
              <DialogTitle className="text-2xl font-bold font-headline">Modify Submission</DialogTitle>
              <DialogDescription className="text-white/70">Update metadata for your institutional resource.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Resource Title</Label>
                <Input 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</Label>
                <Select value={editCatId} onValueChange={setEditCatId}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Description</Label>
                <Textarea 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                  className="min-h-[120px] rounded-xl"
                />
              </div>
            </div>
            <DialogFooter className="p-8 bg-zinc-50 border-t">
              <Button variant="ghost" onClick={() => setEditingDoc(null)} className="rounded-xl px-6 font-bold">Cancel</Button>
              <Button onClick={saveEdit} className="bg-primary text-white rounded-xl px-8 font-bold shadow-lg shadow-primary/20">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
