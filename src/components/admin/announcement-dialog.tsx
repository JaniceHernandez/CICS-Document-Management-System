
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
import { Checkbox } from '@/components/ui/checkbox';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { Loader2, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement?: any; 
}

export function AnnouncementDialog({ open, onOpenChange, announcement: editAnn }: AnnouncementDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);
  const { data: programs } = useCollection(programsQuery);

  useEffect(() => {
    if (editAnn) {
      setTitle(editAnn.title || '');
      setContent(editAnn.content || '');
      setSelectedPrograms(editAnn.targetProgramIds || []);
    } else {
      resetForm();
    }
  }, [editAnn, open]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedPrograms([]);
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
      const isEdit = !!editAnn;
      const annId = isEdit ? editAnn.id : doc(collection(firestore, 'announcements')).id;
      const now = new Date().toISOString();

      const annData = {
        id: annId,
        title,
        content,
        publishDate: isEdit ? editAnn.publishDate : now,
        creatorId: user.uid,
        targetProgramIds: selectedPrograms,
        createdAt: isEdit ? editAnn.createdAt : now,
        updatedAt: now,
      };

      if (isEdit) {
        updateDocumentNonBlocking(doc(firestore, 'announcements', annId), annData);
        logActivity(firestore, user.uid, 'DOCUMENT_EDIT', `Updated announcement: ${title}`);
        toast({ title: "Announcement Updated" });
      } else {
        setDocumentNonBlocking(doc(firestore, 'announcements', annId), annData, { merge: true });
        logActivity(firestore, user.uid, 'DOCUMENT_UPLOAD', `Created announcement: ${title}`);
        toast({ title: "Announcement Published" });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl overflow-hidden p-0 border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-white">
          <DialogTitle className="font-headline font-bold text-3xl flex items-center gap-3">
            <Bell className="h-8 w-8 text-secondary" />
            {editAnn ? 'Edit Announcement' : 'Create Announcement'}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Broadcast important updates to CICS students.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto bg-background">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Enrollment Deadline Extended"
              className="h-12 rounded-xl"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content" className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Content</Label>
            <Textarea 
              id="content" 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detailed announcement text..."
              className="min-h-[150px] rounded-xl"
            />
          </div>

          <div className="grid gap-3">
            <Label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Target Programs (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">Leave unselected to broadcast to all students.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              {programs?.map((prog) => (
                <div key={prog.id} className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-zinc-100">
                  <Checkbox 
                    id={prog.id} 
                    checked={selectedPrograms.includes(prog.id)}
                    onCheckedChange={() => handleProgramToggle(prog.id)}
                  />
                  <label htmlFor={prog.id} className="text-sm font-medium cursor-pointer">
                    {prog.shortCode}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 bg-zinc-50 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-12">Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title || !content}
            className="bg-primary text-white rounded-xl h-12 px-12 font-bold"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish Now'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
