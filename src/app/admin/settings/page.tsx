"use client";

import { useState } from 'react';
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
  Calendar,
  Settings2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { logActivity } from '@/lib/activity-logging';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from '@/components/ui/switch';

export default function AdminSettings() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();

  const [newCat, setNewCat] = useState('');
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');

  const [editItem, setEditItem] = useState<any>(null);
  const [editType, setEditItemType] = useState<'category' | 'program' | 'period' | null>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const categoriesQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'categories') : null, [firestore, adminUser]);
  const programsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'programs') : null, [firestore, adminUser]);
  const documentsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'documents') : null, [firestore, adminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);
  const periodsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'inquiryPeriods') : null, [firestore, adminUser]);

  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);
  const { data: documents } = useCollection(documentsQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: periods } = useCollection(periodsQuery);

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

  const togglePeriod = async (period: any) => {
    if (!firestore || !adminUser) return;
    try {
      await updateDoc(doc(firestore, 'inquiryPeriods', period.id), {
        isEnabled: !period.isEnabled,
        updatedAt: new Date().toISOString()
      });
      logActivity(firestore, adminUser.uid, 'INQUIRY_PERIOD_UPDATE', `Toggled inquiry period: ${period.name}`);
      toast({ title: "Setting Updated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
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
      logActivity(firestore, adminUser.uid, 'DOCUMENT_EDIT', `Updated ${editType}: ${editName}`);
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
    const inUse = documents?.filter(d => d.categoryId === cat.id);
    if (inUse && inUse.length > 0) {
      toast({ title: "Access Denied", description: "Category is linked to active documents.", variant: "destructive" });
      return;
    }
    if (confirm(`Remove the category "${cat.name}"?`)) {
      await deleteDoc(doc(firestore, 'categories', cat.id));
      logActivity(firestore, adminUser.uid, 'DOCUMENT_DELETE', `Removed category: ${cat.name}`);
      toast({ title: "Category Removed" });
    }
  };

  const deleteProgram = async (prog: any) => {
    if (!firestore || !adminUser) return;
    const docsInUse = documents?.filter(d => d.programIds?.includes(prog.id));
    const studentsInUse = users?.filter(u => u.programIds?.includes(prog.id));
    if ((docsInUse && docsInUse.length > 0) || (studentsInUse && studentsInUse.length > 0)) {
      toast({ title: "Access Denied", description: "Program is currently in use.", variant: "destructive" });
      return;
    }
    if (confirm(`Permanently remove academic program "${prog.shortCode}"?`)) {
      await deleteDoc(doc(firestore, 'programs', prog.id));
      logActivity(firestore, adminUser.uid, 'DOCUMENT_DELETE', `Removed program: ${prog.shortCode}`);
      toast({ title: "Program Removed" });
    }
  };

  return (
    <main className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-headline font-bold text-primary">System Settings</h1>
          <p className="text-muted-foreground">Manage institutional data structures and global configurations.</p>
        </header>

        <div className="grid grid-cols-1 gap-10">
          {/* Document Classifications Table */}
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-zinc-50/50 border-b p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Document Classifications</CardTitle>
                    <CardDescription>Primary categories used for sorting library records.</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="New category..." 
                    className="w-64 h-10 rounded-xl"
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                  />
                  <Button onClick={addCategory} disabled={!newCat || isProcessing} className="rounded-xl h-10 bg-primary font-bold">
                    <Plus className="h-4 w-4 mr-2" /> Add
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/30">
                  <TableRow>
                    <TableHead className="px-6 font-bold text-xs uppercase tracking-widest">Classification Name</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest text-center">Records Linked</TableHead>
                    <TableHead className="px-6 text-right font-bold text-xs uppercase tracking-widest">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories?.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-zinc-50/50">
                      <TableCell className="px-6 font-bold text-zinc-700">{cat.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-bold">
                          {documents?.filter(d => d.categoryId === cat.id).length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-primary" onClick={() => handleEdit(cat, 'category')}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => deleteCategory(cat)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Academic Programs Table */}
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-zinc-50/50 border-b p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Academic Programs</CardTitle>
                    <CardDescription>Managed undergraduate degrees within the College.</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Program Name" className="w-48 h-10 rounded-xl" value={newProgName} onChange={(e) => setNewProgName(e.target.value)} />
                  <Input placeholder="Code" className="w-24 h-10 rounded-xl" value={newProgCode} onChange={(e) => setNewProgCode(e.target.value)} />
                  <Button onClick={addProgram} disabled={!newProgName || !newProgCode || isProcessing} className="rounded-xl h-10 bg-primary font-bold">
                    Add Program
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/30">
                  <TableRow>
                    <TableHead className="px-6 font-bold text-xs uppercase tracking-widest">Code</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-widest">Full Degree Program Name</TableHead>
                    <TableHead className="px-6 text-right font-bold text-xs uppercase tracking-widest">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {programs?.sort((a,b) => a.shortCode.localeCompare(b.shortCode)).map((prog) => (
                    <TableRow key={prog.id} className="hover:bg-zinc-50/50">
                      <TableCell className="px-6">
                        <Badge className="bg-primary/5 text-primary border-none font-bold uppercase">{prog.shortCode}</Badge>
                      </TableCell>
                      <TableCell className="font-bold text-zinc-700">{prog.name}</TableCell>
                      <TableCell className="px-6 text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-primary" onClick={() => handleEdit(prog, 'program')}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-destructive" onClick={() => deleteProgram(prog)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Operational Settings */}
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-zinc-50/50 border-b p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">System Operations</CardTitle>
                  <CardDescription>Global toggles and inquiry period configurations.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900">Current Semester Inquiry Period</p>
                      <p className="text-sm text-muted-foreground font-medium">Allow students to submit new support inquiries.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {periods?.map((period) => (
                      <div key={period.id} className="flex items-center gap-3">
                        <Switch 
                          checked={period.isEnabled} 
                          onCheckedChange={() => togglePeriod(period)}
                        />
                        <Badge className={cn(
                          "border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5",
                          period.isEnabled ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                        )}>
                          {period.isEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
          <DialogContent className="max-w-md rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-8 bg-primary text-white">
              <DialogTitle className="text-2xl font-bold font-headline uppercase">Update {editType}</DialogTitle>
              <DialogDescription className="text-white/70">Modify institutional entry details.</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 rounded-xl" />
              </div>
              {editType === 'program' && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Short Code</Label>
                  <Input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="h-12 rounded-xl" />
                </div>
              )}
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3 text-xs text-amber-700">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>Changes will propagate across all linked documents and user profiles instantly.</p>
              </div>
            </div>
            <DialogFooter className="p-8 bg-zinc-50 border-t flex items-center justify-between">
              <Button variant="ghost" onClick={() => setEditItem(null)}>Cancel</Button>
              <Button onClick={saveEdit} disabled={isProcessing || !editName} className="bg-primary text-white rounded-xl px-8 font-bold">{isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  );
}
