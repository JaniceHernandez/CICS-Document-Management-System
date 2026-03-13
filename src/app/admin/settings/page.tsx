
"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FolderTree, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Edit2, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { logActivity } from '@/lib/activity-logging';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

export default function AdminSettings() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();

  // Create States
  const [newCat, setNewCat] = useState('');
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');

  // Edit States
  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditItemType] = useState<'category' | 'program' | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Data Queries
  const categoriesQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'categories') : null, [firestore, adminUser]);
  const programsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'programs') : null, [firestore, adminUser]);
  const documentsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'documents') : null, [firestore, adminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);

  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);
  const { data: documents } = useCollection(documentsQuery);
  const { data: users } = useCollection(usersQuery);

  const addCategory = async () => {
    if (!firestore || !adminUser || !newCat) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'categories'), {
        name: newCat,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      logActivity(firestore, adminUser.uid, 'CATEGORY_CREATE', `Added category: ${newCat}`);
      setNewCat('');
      toast({ title: "Category Added" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const addProgram = async () => {
    if (!firestore || !adminUser || !newProgName || !newProgCode) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'programs'), {
        name: newProgName,
        shortCode: newProgCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      logActivity(firestore, adminUser.uid, 'PROGRAM_CREATE', `Added program: ${newProgCode}`);
      setNewProgName('');
      setNewProgCode('');
      toast({ title: "Program Added" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (item: any, type: 'category' | 'program') => {
    setEditItem(item);
    setEditItemType(type);
    setEditName(item.name);
    setEditCode(item.shortCode || '');
  };

  const saveEdit = async () => {
    if (!firestore || !adminUser || !editItem || !editType) return;
    setIsProcessing(true);
    try {
      const docRef = doc(firestore, editType === 'category' ? 'categories' : 'programs', editItem.id);
      const updateData: any = {
        name: editName,
        updatedAt: new Date().toISOString()
      };
      if (editType === 'program') {
        updateData.shortCode = editCode;
      }
      await updateDoc(docRef, updateData);
      logActivity(firestore, adminUser.uid, editType === 'category' ? 'DOCUMENT_EDIT' : 'DOCUMENT_EDIT', `Updated ${editType}: ${editName}`);
      toast({ title: `${editType.charAt(0).toUpperCase() + editType.slice(1)} Updated` });
      setEditItem(null);
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteCategory = async (cat: any) => {
    if (!firestore || !adminUser) return;
    
    // Integrity Check: Is any document using this category?
    const inUse = documents?.filter(d => d.categoryId === cat.id);
    if (inUse && inUse.length > 0) {
      toast({
        title: "Access Denied",
        description: `This category is currently linked to ${inUse.length} documents. Reassign or remove them first.`,
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Are you sure you want to remove the category "${cat.name}"?`)) {
      await deleteDoc(doc(firestore, 'categories', cat.id));
      logActivity(firestore, adminUser.uid, 'DOCUMENT_DELETE', `Removed category: ${cat.name}`);
      toast({ title: "Category Removed" });
    }
  };

  const deleteProgram = async (prog: any) => {
    if (!firestore || !adminUser) return;

    // Integrity Check: Is any student or document using this program?
    const docsInUse = documents?.filter(d => d.programIds?.includes(prog.id));
    const studentsInUse = users?.filter(u => u.programIds?.includes(prog.id));
    
    if ((docsInUse && docsInUse.length > 0) || (studentsInUse && studentsInUse.length > 0)) {
      const docCount = docsInUse?.length || 0;
      const studentCount = studentsInUse?.length || 0;
      toast({
        title: "Access Denied",
        description: `Program in use by ${docCount} documents and ${studentCount} students.`,
        variant: "destructive"
      });
      return;
    }

    if (confirm(`Permanently remove academic program "${prog.shortCode}"?`)) {
      await deleteDoc(doc(firestore, 'programs', prog.id));
      logActivity(firestore, adminUser.uid, 'DOCUMENT_DELETE', `Removed program: ${prog.shortCode}`);
      toast({ title: "Program Removed" });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary">System Settings</h1>
            <p className="text-muted-foreground">Manage organizational structure and data classifications.</p>
          </header>

          <div className="grid grid-cols-1 gap-8">
            {/* Categories Management */}
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Document Classifications</CardTitle>
                    <CardDescription>Primary categories used for sorting institutional records and student filings.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories?.map((cat) => (
                    <div key={cat.id} className="group p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                      <span className="font-bold text-sm text-zinc-700">{cat.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-primary"
                          onClick={() => handleEdit(cat, 'category')}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-destructive"
                          onClick={() => deleteCategory(cat)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 items-end bg-zinc-50/50 p-6 rounded-2xl border border-dashed border-zinc-200">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="cat-name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">New Category Name</Label>
                    <Input 
                      id="cat-name" 
                      placeholder="e.g. Syllabi, Forms, CAPSTONE" 
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      className="rounded-xl h-11 bg-white border-zinc-200"
                    />
                  </div>
                  <Button 
                    onClick={addCategory} 
                    disabled={!newCat || isProcessing} 
                    className="rounded-xl h-11 bg-primary text-white px-6 font-bold shadow-lg shadow-primary/10"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-2" /> Add</>}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Programs Management */}
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="border-b bg-zinc-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Academic Programs</CardTitle>
                    <CardDescription>Managed undergraduate degrees within the College.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs?.map((prog) => (
                    <div key={prog.id} className="group p-5 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-start justify-between hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <Badge className="mb-2 bg-primary/5 text-primary border-none rounded-md px-2 py-0 text-[10px] font-bold">{prog.shortCode}</Badge>
                        <p className="font-bold text-zinc-900 leading-tight">{prog.name}</p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-primary"
                          onClick={() => handleEdit(prog, 'program')}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-zinc-400 hover:text-destructive"
                          onClick={() => deleteProgram(prog)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50/50 p-6 rounded-2xl border border-dashed border-zinc-200">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Program Name</Label>
                    <Input placeholder="e.g. BS in Information Systems" value={newProgName} onChange={(e) => setNewProgName(e.target.value)} className="rounded-xl bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Short Code</Label>
                    <Input placeholder="e.g. BSIS" value={newProgCode} onChange={(e) => setNewProgCode(e.target.value)} className="rounded-xl bg-white" />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={addProgram} 
                      disabled={!newProgName || !newProgCode || isProcessing} 
                      className="w-full h-11 bg-primary text-white rounded-xl font-bold"
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Program"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
          <DialogContent className="max-w-md rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-primary text-white">
              <div className="p-3 bg-white/10 w-fit rounded-2xl mb-4">
                <Edit2 className="h-6 w-6 text-secondary" />
              </div>
              <DialogTitle className="text-2xl font-bold font-headline uppercase">Update {editType}</DialogTitle>
              <DialogDescription className="text-white/70">Modify institutional entry details.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Name</Label>
                <Input 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)} 
                  className="h-12 rounded-xl focus-visible:ring-primary shadow-sm"
                />
              </div>
              {editType === 'program' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Short Code</Label>
                  <Input 
                    value={editCode} 
                    onChange={(e) => setEditCode(e.target.value)} 
                    className="h-12 rounded-xl focus-visible:ring-primary shadow-sm"
                  />
                </div>
              )}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed font-medium">
                  Changes will propagate across all linked documents and user profiles instantly.
                </p>
              </div>
            </div>
            <DialogFooter className="p-8 bg-zinc-50 border-t flex items-center justify-between">
              <Button variant="ghost" onClick={() => setEditItem(null)} className="rounded-xl px-6 font-bold text-zinc-500">Cancel</Button>
              <Button 
                onClick={saveEdit} 
                disabled={isProcessing || !editName}
                className="bg-primary text-white rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
