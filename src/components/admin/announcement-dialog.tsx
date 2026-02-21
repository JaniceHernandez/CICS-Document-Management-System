
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
        status: isEdit ? (editAnn.status || 'published') : 'published',
        createdAt: isEdit ? editAnn.createdAt : now,
        updatedAt: now,
      };

      if (isEdit) {
        updateDocumentNonBlocking(doc(firestore, 'announcements', annId), annData);
        logActivity(firestore, user.uid, 'ANNOUNCEMENT_EDIT', `Updated announcement: ${title}`);
        toast({ title: "Announcement Updated" });
      } else {
        setDocumentNonBlocking(doc(firestore, 'announcements', annId), annData, { merge: true });
        logActivity(firestore, user.uid, 'ANNOUNCEMENT_CREATE', `Created announcement: ${title}`);
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
      <DialogContent className="max-w-2xl rounded-3xl overflow-hidden p-0 border-none shadow-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-10 bg-primary text-white shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 rounded-2xl">
              <Bell className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <DialogTitle className="font-headline font-bold text-3xl">
                {editAnn ? 'Modify Broadcast' : 'New Broadcast'}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-base">
                Disseminate important institutional updates.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-10 space-y-8 overflow-y-auto bg-zinc-50/50 flex-1">
          <div className="grid gap-3">
            <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Subject Header</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g. Schedule for First Semester Enrollment"
              className="h-14 rounded-2xl bg-white border-zinc-200 shadow-sm focus-visible:ring-primary"
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="content" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Broadcast Message</Label>
            <Textarea 
              id="content" 
              value={content} 
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide detailed instructions or news here..."
              className="min-h-[200px] rounded-2xl bg-white border-zinc-200 shadow-sm focus-visible:ring-primary p-6 resize-none"
            />
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Target Academic Programs</Label>
              <span className="text-[10px] font-bold text-primary uppercase">Default: Global (All Students)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-6 bg-white rounded-3xl border border-zinc-100 shadow-inner">
              {programs?.map((prog) => (
                <div 
                  key={prog.id} 
                  className={cn(
                    "flex items-center space-x-4 p-4 rounded-2xl border transition-all cursor-pointer",
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
                    className="h-5 w-5 rounded-md"
                  />
                  <div className="flex-1">
                    <p className="font-bold text-sm text-primary">{prog.shortCode}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{prog.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="p-10 bg-white border-t shrink-0 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-2xl h-12 px-8 text-zinc-500 font-bold">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !title || !content}
            className="bg-primary text-white rounded-2xl h-14 px-12 font-bold shadow-2xl shadow-primary/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : (editAnn ? 'Save Changes' : 'Broadcast Now')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
