
'use client';

import { useState, useEffect } from 'react';
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { put } from '@vercel/blob';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { Loader2, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: any; // If provided, we're in "Edit" mode
}

export function DocumentDialog({ open, onOpenChange, document: editDoc }: DocumentDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // Fetch Categories and Programs
  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);

  useEffect(() => {
    if (editDoc) {
      setTitle(editDoc.title || '');
      setDescription(editDoc.description || '');
      setCategoryId(editDoc.categoryId || '');
      setSelectedPrograms(editDoc.programIds || []);
    } else {
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

      // Handle File Upload via Vercel Blob if a new file is selected
      if (file) {
        // We use the docId in the path to keep it organized
        const blob = await put(`documents/${docId}/${file.name}`, file, {
          access: 'public',
        });
        fileUrl = blob.url;
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
        uploadDate: isEdit ? editDoc.uploadDate : now,
        uploaderId: user.uid,
        categoryId,
        programIds: selectedPrograms,
        downloadCount: isEdit ? editDoc.downloadCount : 0,
        createdAt: isEdit ? editDoc.createdAt : now,
        updatedAt: now,
      };

      if (isEdit) {
        updateDocumentNonBlocking(doc(firestore, 'documents', docId), docData);
        logActivity(firestore, user.uid, 'DOCUMENT_EDIT', `Updated document: ${title}`, docId);
        toast({ title: "Document Updated", description: `${title} has been successfully updated.` });
      } else {
        setDocumentNonBlocking(doc(firestore, 'documents', docId), docData, { merge: true });
        logActivity(firestore, user.uid, 'DOCUMENT_UPLOAD', `Uploaded new document: ${title}`, docId);
        toast({ title: "Document Uploaded", description: `${title} is now available in the hub.` });
      }

      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving document:", error);
      toast({ 
        variant: "destructive", 
        title: "Upload Failed", 
        description: error.message || "An unexpected error occurred during the upload." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-white">
          <DialogTitle className="font-headline font-bold text-3xl">
            {editDoc ? 'Update Document' : 'Upload Resource'}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {editDoc ? 'Modify existing document metadata and settings.' : 'Upload a PDF to the CICS official repository (Cloud Storage).'}
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-background">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Document Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. BSCS Curriculum v2024"
              className="h-12 rounded-xl focus-visible:ring-primary"
            />
          </div>

          <div className="grid gap-2">
            <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">PDF Source</Label>
            <div 
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                file ? 'border-primary bg-primary/5' : 'border-zinc-200 hover:border-primary hover:bg-zinc-50'
              }`}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center">
                {file ? (
                  <div className="bg-primary p-3 rounded-full mb-3">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <div className="bg-zinc-100 p-3 rounded-full mb-3">
                    <Upload className="h-6 w-6 text-zinc-400" />
                  </div>
                )}
                <p className="font-bold text-lg">
                  {file ? file.name : editDoc ? 'Click to change PDF' : 'Click to select PDF'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'PDF documents up to 50MB'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Description</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary for indexing..."
              className="min-h-[100px] rounded-xl focus-visible:ring-primary"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3">
            <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target Academic Programs</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              {programs?.map((prog) => (
                <div key={prog.id} className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-zinc-100">
                  <Checkbox 
                    id={prog.id} 
                    checked={selectedPrograms.includes(prog.id)}
                    onCheckedChange={() => handleProgramToggle(prog.id)}
                    className="h-5 w-5 rounded-md"
                  />
                  <label htmlFor={prog.id} className="text-sm font-medium cursor-pointer flex-1">
                    {prog.shortCode} <span className="text-xs text-muted-foreground block font-normal">{prog.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-zinc-50 border-t flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="rounded-xl h-12 px-8 flex-1 sm:flex-none border-zinc-200"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title || (!editDoc && !file)}
            className="bg-primary text-white rounded-xl h-12 px-12 font-bold shadow-lg shadow-primary/20 flex-1 sm:flex-none"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              editDoc ? 'Save Changes' : 'Publish Document'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
