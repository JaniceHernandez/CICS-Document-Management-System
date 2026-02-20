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
  Loader2
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

export default function DocumentManagement() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  // Firestore Queries - Only run when both firestore and user are available
  const docsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'documents') : null, [firestore, user]);
  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);

  const { data: documents, isLoading } = useCollection(docsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);

  const filteredDocs = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (document: any) => {
    if (!firestore || !user) return;
    if (confirm(`Are you sure you want to delete "${document.title}"?`)) {
      deleteDocumentNonBlocking(doc(firestore, 'documents', document.id));
      logActivity(firestore, user.uid, 'DOCUMENT_DELETE', `Deleted document: ${document.title}`, document.id);
    }
  };

  const getCategoryName = (catId: string) => {
    return categories?.find(c => c.id === catId)?.name || 'Uncategorized';
  };

  const getProgramCodes = (progIds: string[]) => {
    if (!progIds || progIds.length === 0) return 'All';
    return progIds.map(id => programs?.find(p => p.id === id)?.shortCode).filter(Boolean).join(', ');
  };

  const totalSize = documents?.reduce((acc, d) => acc + (d.fileSize || 0), 0) || 0;
  const sizeInGB = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
  const storagePercent = Math.min(100, (parseFloat(sizeInGB) / 10) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Document Management</h1>
              <p className="text-muted-foreground">Upload, organize, and control access to CICS resources.</p>
            </div>
            <Button 
              onClick={() => { setEditingDoc(null); setIsDialogOpen(true); }}
              className="bg-primary text-white rounded-full h-11 px-6 font-bold shadow-lg shadow-primary/20"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload New PDF
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline font-bold text-xl">Active Repository</CardTitle>
                  <CardDescription>Managing {documents?.length || 0} official documents</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search repository..." 
                    className="pl-9 h-10 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                    <p className="text-muted-foreground">Loading documents...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="font-bold">Document Name</TableHead>
                        <TableHead className="font-bold">Category</TableHead>
                        <TableHead className="font-bold">Program</TableHead>
                        <TableHead className="font-bold">Upload Date</TableHead>
                        <TableHead className="font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocs?.map((doc) => (
                        <TableRow key={doc.id} className="hover:bg-zinc-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/5 rounded-lg">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{doc.title}</p>
                                <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-900 border-none font-medium">
                              {getCategoryName(doc.categoryId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-primary/20 text-primary">
                              {getProgramCodes(doc.programIds)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(doc.uploadDate).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-xl">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem 
                                  className="cursor-pointer"
                                  onClick={() => { setEditingDoc(doc); setIsDialogOpen(true); }}
                                >
                                  <Edit className="h-4 w-4 mr-2" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" asChild>
                                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" /> View File
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive cursor-pointer hover:bg-destructive hover:text-white"
                                  onClick={() => handleDelete(doc)}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete Document
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!isLoading && filteredDocs?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                            {user ? 'No documents found matching your search.' : 'Please sign in to view documents.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-2xl bg-zinc-900 text-white">
                <CardHeader>
                  <CardTitle className="font-headline font-bold flex items-center gap-2">
                    <Upload className="h-5 w-5 text-secondary" />
                    Quick Upload
                  </CardTitle>
                  <CardDescription className="text-zinc-400">Add a new resource to the hub</CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-secondary transition-colors cursor-pointer group"
                    onClick={() => { setEditingDoc(null); setIsDialogOpen(true); }}
                  >
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-secondary group-hover:text-primary transition-colors">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-medium">Upload PDF</p>
                      <p className="text-sm text-zinc-500">Click to start the process</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-headline font-bold">Storage Usage</CardTitle>
                  <CardDescription>CICS Documents Cloud Storage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Used Space</span>
                      <span className="font-bold">{sizeInGB} GB / 10 GB</span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${storagePercent}%` }} 
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your current plan supports up to 10GB of PDF documents. Total documents: {documents?.length || 0}
                  </p>
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
