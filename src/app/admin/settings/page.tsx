"use client";

import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderTree, GraduationCap, Calendar, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, addDoc, doc } from 'firebase/firestore';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { logActivity } from '@/lib/activity-logging';

export default function AdminSettings() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [newCat, setNewCat] = useState('');
  const [newProgName, setNewProgName] = useState('');
  const [newProgCode, setNewProgCode] = useState('');

  const categoriesQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'categories') : null, [firestore, adminUser]);
  const programsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'programs') : null, [firestore, adminUser]);
  const periodsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'inquiryPeriods') : null, [firestore, adminUser]);

  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);
  const { data: periods } = useCollection(periodsQuery);

  const addCategory = async () => {
    if (!firestore || !adminUser || !newCat) return;
    await addDoc(collection(firestore, 'categories'), {
      name: newCat,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    logActivity(firestore, adminUser.uid, 'CATEGORY_CREATE', `Added category: ${newCat}`);
    setNewCat('');
  };

  const addProgram = async () => {
    if (!firestore || !adminUser || !newProgName || !newProgCode) return;
    await addDoc(collection(firestore, 'programs'), {
      name: newProgName,
      shortCode: newProgCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    logActivity(firestore, adminUser.uid, 'PROGRAM_CREATE', `Added program: ${newProgCode}`);
    setNewProgName('');
    setNewProgCode('');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary">Settings</h1>
            <p className="text-muted-foreground">Manage categories and academic programs.</p>
          </header>

          <div className="grid grid-cols-1 gap-8">
            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Document Categories</CardTitle>
                    <CardDescription>File types for sorting documents.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  {categories?.map((cat) => (
                    <Badge key={cat.id} variant="secondary" className="px-4 py-2 rounded-xl border-none bg-zinc-100 text-zinc-900 font-medium">
                      {cat.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-4 items-end bg-zinc-50 p-6 rounded-2xl border border-dashed border-zinc-200">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="cat-name">New Category Name</Label>
                    <Input 
                      id="cat-name" 
                      placeholder="e.g. Syllabi" 
                      value={newCat}
                      onChange={(e) => setNewCat(e.target.value)}
                      className="rounded-xl h-11"
                    />
                  </div>
                  <Button onClick={addCategory} disabled={!newCat} className="rounded-xl h-11 bg-primary text-white px-6">
                    <Plus className="h-4 w-4 mr-2" /> Add Category
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl bg-white">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Academic Programs</CardTitle>
                    <CardDescription>Manage school programs for filtering.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programs?.map((prog) => (
                    <div key={prog.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">{prog.shortCode}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">{prog.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-50 p-6 rounded-2xl border border-dashed border-zinc-200">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="e.g. BS in IT" value={newProgName} onChange={(e) => setNewProgName(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Short Code</Label>
                    <Input placeholder="e.g. BSIT" value={newProgCode} onChange={(e) => setNewProgCode(e.target.value)} className="rounded-xl" />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addProgram} disabled={!newProgName || !newProgCode} className="w-full h-11 bg-primary text-white rounded-xl">
                      Add Program
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
