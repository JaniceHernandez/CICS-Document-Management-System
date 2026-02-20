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
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { Loader2, Upload } from 'lucide-react';

interface DocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document?: any; // If provided, we're in "Edit" mode
}

export function DocumentDialog({ open, onOpenChange, document: editDoc }: DocumentDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // Fetch Categories and Programs - Only run when both firestore and user are available
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
      
      // Simulate file upload URL
      const fileUrl = file ? `https://simulated-storage.com/${file.name}` : (editDoc?.fileUrl || '');

      const docData = {
        id: docId,
        title,
        description,
        fileUrl,
        fileName: file ? file.name : (editDoc?.fileName || 'unknown'),
        fileSize: file ? file.size : (editDoc?.fileSize || 0),
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
      } else {
        setDocumentNonBlocking(doc(firestore, 'documents', docId), docData, { merge: true });
        logActivity(firestore, user.uid, 'DOCUMENT_UPLOAD', `Uploaded new document: ${title}`, docId);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error saving document:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-headline font-bold text-2xl">
            {editDoc ? 'Edit Document Details' : 'Upload New Document'}
          </DialogTitle>
          <DialogDescription>
            Provide detailed information for organizational accuracy.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Document Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. BSCS Curriculum v2024"
            />
          </div>

          {!editDoc && (
            <div className="grid gap-2">
              <Label>PDF File</Label>
              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-zinc-50 transition-colors"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  type="file" 
                  id="file-upload" 
                  className="hidden" 
                  accept=".pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">
                  {file ? file.name : 'Click to select or drag and drop PDF'}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the document content..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
            <Label>Applicable Programs</Label>
            <div className="grid grid-cols-2 gap-2">
              {programs?.map((prog) => (
                <div key={prog.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={prog.id} 
                    checked={selectedPrograms.includes(prog.id)}
                    onCheckedChange={() => handleProgramToggle(prog.id)}
                  />
                  <label htmlFor={prog.id} className="text-sm cursor-pointer">{prog.name} ({prog.shortCode})</label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title || (!editDoc && !file)}
            className="bg-primary text-white rounded-xl min-w-[120px]"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (editDoc ? 'Save Changes' : 'Upload Document')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
