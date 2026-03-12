"use client";

import { useState, useCallback } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
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
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SubmitDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitDocumentDialog({ open, onOpenChange }: SubmitDocumentDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState<File | null>(null);

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
    if (!firestore || !user || !file) return;
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
        programIds: [], // Defaults to Global or Admin can re-assign
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
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-8 bg-primary text-white shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Upload className="h-6 w-6 text-secondary" />
            </div>
            <DialogTitle className="text-3xl font-headline font-bold">Submit Document</DialogTitle>
          </div>
          <DialogDescription className="text-white/70 text-base">
            Share a resource or submit a requirement to the CICS administrators.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-50/50">
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">PDF Attachment</Label>
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 group",
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
              <div className="flex flex-col items-center space-y-3">
                {file ? (
                  <div className="bg-green-500 p-3 rounded-xl text-white">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                ) : (
                  <div className="bg-zinc-100 p-3 rounded-xl text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Upload className="h-6 w-6" />
                  </div>
                )}
                
                <div>
                  <p className="font-bold text-lg text-zinc-900">
                    {file ? file.name : 'Choose a file'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Drag and drop or click to browse PDF'}
                  </p>
                </div>

                {!file && (
                  <Button 
                    variant="outline" 
                    className="rounded-full px-6 h-9 text-xs border-zinc-200"
                    onClick={() => document.getElementById('student-file-upload')?.click()}
                  >
                    Select File
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Document Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. Project Proposal - Group 1"
                className="h-11 rounded-xl bg-white border-zinc-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-11 rounded-xl bg-white border-zinc-200">
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
              <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Short Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the document contents..."
                className="min-h-[100px] rounded-xl bg-white border-zinc-200 resize-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex gap-4">
            <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-blue-900">Information</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Admins will be notified of your submission. Once reviewed, it may be published to the general library or specific program portals.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-white border-t shrink-0 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-11 px-6 text-zinc-500">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title || !file || !categoryId}
            className="bg-primary text-white rounded-xl h-11 px-10 font-bold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-3" /> : 'Send to Admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}