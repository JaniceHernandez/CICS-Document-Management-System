
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { uploadToBlob } from '@/app/actions/storage';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
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
  Info 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const { data: categories } = useCollection(categoriesQuery);

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
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">Document Submission</h1>
            <p className="text-muted-foreground text-lg">Share educational resources or submit requirements to administrators.</p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-zinc-50">
                  <CardTitle className="font-headline font-bold text-xl flex items-center gap-3 text-primary">
                    <Upload className="h-6 w-6" />
                    Upload Details
                  </CardTitle>
                  <CardDescription>Provide metadata for your institutional submission.</CardDescription>
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
                        className="min-h-[150px] rounded-2xl bg-zinc-50 border-none shadow-inner p-6 resize-none focus-visible:ring-primary"
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
                        Submit to Admin
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
                  <div className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-3 w-3 text-primary" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">By submitting, you affirm that you have the right to share this material academically.</p>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">Privacy Notice</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Your institutional ID is recorded with every submission for auditing and security monitoring.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
