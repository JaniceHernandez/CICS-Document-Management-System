"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Plus, 
  Upload, 
  Search, 
  MoreVertical, 
  FileText, 
  Trash2, 
  Edit, 
  ExternalLink,
  Loader2,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { DocumentDialog } from '@/components/admin/document-dialog';
import { logActivity } from '@/lib/activity-logging';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function DocumentManagement() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const documentsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'documents') : null, [firestore, user]);
  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);

  const { data: documents, isLoading: docsLoading } = useCollection(documentsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);

  const filteredDocs = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const handleDelete = (document: any) => {
    if (!firestore || !user) return;
    if (confirm(`Delete "${document.title}" permanently?`)) {
      deleteDocumentNonBlocking(doc(firestore, 'documents', document.id));
      logActivity(firestore, user.uid, 'DOCUMENT_DELETE', `Deleted document: ${document.title}`, document.id);
      toast({
        title: "Document Deleted",
        description: "File and info removed from the list.",
      });
    }
  };

  const getCategoryName = (catId: string) => {
    return categories?.find(c => c.id === catId)?.name || 'Uncategorized';
  };

  const getProgramCodes = (progIds: string[]) => {
    if (!progIds || progIds.length === 0) return 'All Programs';
    return progIds.map(id => programs?.find(p => p.id === id)?.shortCode).join(', ');
  };

  const totalSize = documents?.reduce((acc, d) => acc + (d.fileSize || 0), 0) || 0;
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, (parseFloat(sizeInMB) / 1024) * 100);

  return (
    <div className="flex min-h-screen bg-zinc-50/30">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Documents</h1>
              <p className="text-muted-foreground mt-1 text-lg">Manage all school documents and files.</p>
            </div>
            <Button 
              onClick={() => { setEditingDoc(null); setIsDialogOpen(true); }}
              className="bg-primary text-white hover:bg-primary/90 rounded-full h-12 px-8 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Document
            </Button>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-3 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-zinc-50 flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="font-headline font-bold text-xl">All Documents</CardTitle>
                  <CardDescription>Managing {documents?.length || 0} files</CardDescription>
                </div>
                <div className="flex gap-4">
                  <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search files..." 
                      className="pl-11 h-11 rounded-2xl bg-zinc-50 border-none focus-visible:ring-primary"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {docsLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-muted-foreground font-medium">Loading files...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-zinc-50/50">
                      <TableRow className="border-none">
                        <TableHead className="font-bold px-8">File Info</TableHead>
                        <TableHead className="font-bold">Category</TableHead>
                        <TableHead className="font-bold">Access</TableHead>
                        <TableHead className="font-bold">Date</TableHead>
                        <TableHead className="font-bold text-right px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocs?.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                          <TableCell className="px-8 py-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center">
                                <FileText className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 leading-tight">{doc.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">{doc.fileName} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none font-bold uppercase text-[10px] tracking-wider px-3">
                              {getCategoryName(doc.categoryId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {doc.programIds?.length > 0 ? (
                                doc.programIds.map((pid: string) => (
                                  <Badge key={pid} variant="outline" className="border-primary/20 text-primary text-[10px] font-bold">
                                    {programs?.find(p => p.id === pid)?.shortCode}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="border-zinc-200 text-zinc-400 text-[10px] font-bold">PUBLIC</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-zinc-500 font-medium">
                              {new Date(doc.updatedAt || doc.uploadDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-8">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                                <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-3 py-2 uppercase tracking-widest">Options</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary"
                                  onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); }}
                                >
                                  <Edit className="h-4 w-4 mr-3" /> Edit Info
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary" asChild>
                                  <a href={`/api/blob?url=${encodeURIComponent(doc.fileUrl)}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-3" /> View File
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-zinc-50" />
                                <DropdownMenuItem 
                                  className="rounded-xl text-destructive cursor-pointer py-3 focus:bg-destructive focus:text-white"
                                  onClick={() => handleDelete(doc)}
                                >
                                  <Trash2 className="h-4 w-4 mr-3" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-none shadow-sm rounded-3xl bg-primary text-white overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Upload className="h-24 w-24" />
                </div>
                <CardHeader className="p-8">
                  <CardTitle className="font-headline font-bold text-2xl flex items-center gap-3">
                    Quick Add
                  </CardTitle>
                  <CardDescription className="text-white/60">Upload new documents.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-3xl p-10 flex flex-col items-center justify-center text-center space-y-4 hover:border-secondary hover:bg-white/5 transition-all cursor-pointer"
                    onClick={() => { setEditingDoc(null); setIsDialogOpen(true); }}
                  >
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-primary shadow-xl shadow-secondary/20">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">Add New File</p>
                      <p className="text-xs text-white/40">Drop PDF here or click to add</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-zinc-50">
                  <CardTitle className="font-headline font-bold text-xl">Cloud Storage</CardTitle>
                  <CardDescription>File usage info</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Space Used</span>
                      <span className="text-lg font-bold text-primary tabular-nums">{sizeInMB} MB</span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary transition-all duration-1000 ease-out" 
                        style={{ width: `${storagePercent}%` }} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Files</p>
                      <p className="text-2xl font-bold text-primary">{documents?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Size</p>
                      <p className="text-2xl font-bold text-primary">
                        {documents?.length ? (totalSize / documents.length / 1024 / 1024).toFixed(1) : 0} <span className="text-xs">MB</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <DocumentDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          document={editingDoc}
        />
      </main>
    </div>
  );
}
