"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  FileText, 
  Trash2, 
  Edit, 
  ExternalLink,
  Loader2,
  User
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
import { deleteFromBlob } from '@/app/actions/storage';
import { DocumentDialog } from '@/components/admin/document-dialog';
import { logActivity } from '@/lib/activity-logging';
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
  const usersQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users') : null, [firestore, user]);

  const { data: documents, isLoading: docsLoading } = useCollection(documentsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);
  const { data: users } = useCollection(usersQuery);

  const filteredDocs = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const handleDelete = async (document: any) => {
    if (!firestore || !user) return;
    if (confirm(`Delete "${document.title}" permanently?`)) {
      try {
        deleteDocumentNonBlocking(doc(firestore, 'documents', document.id));
        if (document.fileUrl) {
          await deleteFromBlob(document.fileUrl);
        }
        logActivity(firestore, user.uid, 'DOCUMENT_DELETE', `Deleted document and file: ${document.title}`, document.id);
        toast({
          title: "Document Deleted",
          description: "File and record removed successfully.",
        });
      } catch (e: any) {
        toast({
          title: "Cleanup Error",
          description: "Record removed but cloud file deletion might have failed.",
          variant: "destructive"
        });
      }
    }
  };

  const getCategoryName = (catId: string) => {
    return categories?.find(c => c.id === catId)?.name || 'Uncategorized';
  };

  const getUploaderName = (uid: string) => {
    const found = users?.find(u => u.id === uid);
    if (!found) return 'System';
    return found.fullName || found.email;
  };

  const totalSize = documents?.reduce((acc, d) => acc + (d.fileSize || 0), 0) || 0;
  const sizeInMB = (totalSize / (1024 * 1024)).toFixed(1);
  const storagePercent = Math.min(100, (parseFloat(sizeInMB) / 500) * 100);

  return (
    <div className="flex min-h-screen bg-zinc-50/30">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Documents</h1>
              <p className="text-muted-foreground mt-1 text-lg">Manage and host institutional resources.</p>
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
                  <CardDescription>Managing {documents?.length || 0} active files</CardDescription>
                </div>
                <div className="flex gap-4">
                  <div className="relative w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search resources..." 
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
                    <p className="text-muted-foreground font-medium">Loading library...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-zinc-50/50">
                      <TableRow className="border-none">
                        <TableHead className="font-bold px-8 text-[10px] uppercase tracking-widest">Resource Info</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Category</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Uploader</TableHead>
                        <TableHead className="font-bold text-[10px] uppercase tracking-widest">Modified</TableHead>
                        <TableHead className="font-bold text-right px-8 text-[10px] uppercase tracking-widest">Options</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocs?.map((doc) => {
                        const isStudentSubmission = users?.find(u => u.id === doc.uploaderId)?.role === 'Student';
                        return (
                          <TableRow key={doc.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50 group">
                            <TableCell className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                  <FileText className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="font-bold text-zinc-900 leading-tight">{doc.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB • PDF</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none font-bold uppercase text-[9px] tracking-wider px-3 py-1">
                                {getCategoryName(doc.categoryId)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-700">{getUploaderName(doc.uploaderId)}</span>
                                {isStudentSubmission && (
                                  <Badge variant="outline" className="w-fit text-[8px] h-4 mt-1 border-secondary text-primary font-bold">STUDENT SUBMISSION</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-[11px] text-zinc-500 font-bold uppercase">
                                {new Date(doc.updatedAt || doc.uploadDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="text-right px-8">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 h-10 w-10">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                                  <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-widest">Manage Resource</DropdownMenuLabel>
                                  <DropdownMenuItem 
                                    className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary font-medium"
                                    onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); }}
                                  >
                                    <Edit className="h-4 w-4 mr-3" /> Edit Metadata
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary font-medium" asChild>
                                    <a href={`/api/blob?url=${encodeURIComponent(doc.fileUrl)}`} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-3" /> Open File
                                    </a>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-2 bg-zinc-50" />
                                  <DropdownMenuItem 
                                    className="rounded-xl text-destructive cursor-pointer py-3 focus:bg-destructive focus:text-white font-medium"
                                    onClick={() => handleDelete(doc)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-3" /> Delete Permanently
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <CardHeader className="p-8 border-b border-zinc-50">
                  <CardTitle className="font-headline font-bold text-xl">Cloud Usage</CardTitle>
                  <CardDescription>Storage quota monitoring</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Hosted</span>
                      <span className="text-xl font-bold text-primary tabular-nums">{sizeInMB} MB</span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary transition-all duration-1000 ease-out" 
                        style={{ width: `${storagePercent}%` }} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 bg-zinc-50 rounded-2xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Total Assets</p>
                      <p className="text-2xl font-bold text-primary">{documents?.length || 0}</p>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-2xl">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Avg Weight</p>
                      <p className="text-2xl font-bold text-primary">
                        {documents?.length ? (totalSize / documents.length / 1024 / 1024).toFixed(1) : 0} <span className="text-[10px]">MB</span>
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