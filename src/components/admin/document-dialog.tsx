
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { uploadToBlob } from '@/app/actions/storage';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { Loader2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: any;
}

export function DocumentDialog({ open, onOpenChange, document: editDoc }: DocumentDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);
  
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);

  useEffect(() => {
    if (editDoc && open) {
      setTitle(editDoc.title || '');
      setDescription(editDoc.description || '');
      setCategoryId(editDoc.categoryId || '');
      setSelectedPrograms(editDoc.programIds || []);
      setFile(null);
    } else if (open) {
      resetForm();
    }
  }, [editDoc, open]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setSelectedPrograms([]);
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

  const handleProgramToggle = (programId: string) => {
    setSelectedPrograms(prev => 
      prev.includes(programId) 
        ? prev.filter(id => id !== programId) 
        : [...prev, programId]
    );
  };

  const handleSubmit = async () => {
    if (!firestore || !user) return;
    setLoading(true);

    try {
      const isEdit = !!editDoc;
      const docId = isEdit ? editDoc.id : doc(collection(firestore, 'documents')).id;
      const now = new Date().toISOString();
      
      let fileUrl = editDoc?.fileUrl || '';
      let fileName = editDoc?.fileName || 'unknown';
      let fileSize = editDoc?.fileSize || 0;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `cics-docs/${docId}-${file.name}`);
        
        fileUrl = await uploadToBlob(formData);
        fileName = file.name;
        fileSize = file.size;
      }

      const docData = {
        id: docId,
        title,
        description,
        fileUrl,
        fileName,
        fileSize,
        type: 'institutional',
        uploadDate: isEdit ? editDoc.uploadDate : now,
        uploaderId: user.uid,
        categoryId,
        programIds: selectedPrograms,
        downloadCount: isEdit ? editDoc.downloadCount : 0,
        visibilityStatus: isEdit ? (editDoc.visibilityStatus || 'published') : 'published',
        createdAt: isEdit ? editDoc.createdAt : now,
        updatedAt: now,
      };

      if (isEdit) {
        updateDocumentNonBlocking(doc(firestore, 'documents', docId), docData);
        logActivity(firestore, user.uid, 'DOCUMENT_EDIT', `Modified resource metadata: ${title}`, docId);
        toast({ title: "Resource Updated" });
      } else {
        setDocumentNonBlocking(doc(firestore, 'documents', docId), docData, { merge: true });
        logActivity(firestore, user.uid, 'DOCUMENT_UPLOAD', `Published new resource: ${title}`, docId);
        toast({ title: "Resource Published", description: "The document is now live in the library." });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Deployment Failed", 
        description: error.message || "Failed to sync document with cloud services." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-8 bg-primary text-white shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Upload className="h-6 w-6 text-secondary" />
            </div>
            <DialogTitle className="text-3xl font-headline font-bold">
              {editDoc ? 'Update Resource' : 'Publish Resource'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-white/70 text-base">
            Configure institutional metadata and visibility for this curriculum asset.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-zinc-50/50">
          <div className="space-y-3">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Source Material</Label>
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
                id="file-upload" 
                className="hidden" 
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center space-y-4">
                {file ? (
                  <div className="bg-green-500 p-4 rounded-2xl shadow-xl shadow-green-500/20 text-white">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="bg-zinc-100 p-4 rounded-2xl text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Upload className="h-8 w-8" />
                  </div>
                )}
                
                <div className="max-w-xs mx-auto px-4">
                  <p className="font-bold text-xl text-zinc-900 truncate">
                    {file ? file.name : editDoc ? 'Swap PDF Document' : 'Drop PDF Document'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB • Ready to sync` : 'Drag and drop or click to browse files'}
                  </p>
                </div>

                {!file && (
                  <Button 
                    variant="outline" 
                    className="rounded-full px-8 h-10 border-zinc-200 hover:border-primary hover:text-primary"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Select Local File
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Title</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Institutional title..."
                  className="h-12 rounded-2xl bg-white border-zinc-200 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Classification</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="h-12 rounded-2xl bg-white border-zinc-200">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="rounded-xl my-1">{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Institutional Notes</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary for student indexing..."
                className="min-h-[128px] rounded-2xl bg-white border-zinc-200 focus-visible:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Target Academic Programs</Label>
              <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                {selectedPrograms.length || 'ALL'} SELECTED
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-6 bg-white rounded-3xl border border-zinc-100 shadow-inner">
              {programs?.map((prog) => (
                <div 
                  key={prog.id} 
                  className={cn(
                    "flex items-start space-x-3 p-4 rounded-2xl border transition-all cursor-pointer",
                    selectedPrograms.includes(prog.id) 
                      ? "bg-primary/5 border-primary shadow-sm" 
                      : "bg-zinc-50 border-transparent hover:border-zinc-200"
                  )}
                  onClick={() => handleProgramToggle(prog.id)}
                >
                  <Checkbox 
                    id={prog.id} 
                    checked={selectedPrograms.includes(prog.id)}
                    onCheckedChange={() => handleProgramToggle(prog.id)}
                    className="h-5 w-5 rounded-md mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-primary leading-tight">{prog.shortCode}</p>
                    <p className="text-[10px] text-muted-foreground truncate uppercase mt-0.5">{prog.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
            <AlertCircle className="h-6 w-6 text-amber-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-amber-900">Deployment Notice</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                By publishing, this document will be instantly accessible to students in the targeted programs. You can later 'Hide' the record from the dashboard.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-white border-t shrink-0 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="rounded-2xl h-12 px-8 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title || (!editDoc && !file)}
            className="bg-primary text-white hover:bg-primary/90 rounded-2xl h-12 px-12 font-bold shadow-2xl shadow-primary/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-3" />
                Synchronizing...
              </>
            ) : (
              editDoc ? 'Save Metadata' : 'Initiate Deployment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
