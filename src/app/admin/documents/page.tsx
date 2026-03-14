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
  Eye,
  EyeOff,
  Globe,
  Lock
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
import { collection, doc, updateDoc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { deleteFromBlob } from '@/app/actions/storage';
import { DocumentDialog } from '@/components/admin/document-dialog';
import { logActivity } from '@/lib/activity-logging';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function DocumentManagement() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  const documentsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'documents') : null, [firestore, user]);
  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);

  const { data: documents, isLoading: docsLoading } = useCollection(documentsQuery);
  const { data: categories } = useCollection(categoriesQuery);

  const filteredDocs = documents?.filter(doc => {
    // Only show institutional records in this view (not student submissions)
    const isInstitutional = doc.type === 'institutional' || !doc.fileUrl?.includes('student-submissions');
    const matchesSearch = (doc.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    return isInstitutional && matchesSearch;
  }).sort((a, b) => new Date(b.uploadDate || b.createdAt || 0).getTime() - new Date(a.uploadDate || a.createdAt || 0).getTime());

  const handleToggleVisibility = async (documentData: any) => {
    if (!firestore || !user) return;
    const currentStatus = documentData.visibilityStatus || 'published';
    const isHidden = currentStatus === 'hidden';
    const newStatus = isHidden ? 'published' : 'hidden';
    
    try {
      await updateDoc(doc(firestore, 'documents', documentData.id), {
        visibilityStatus: newStatus,
        updatedAt: new Date().toISOString()
      });
      
      logActivity(
        firestore, 
        user.uid, 
        'DOCUMENT_EDIT', 
        `${isHidden ? 'Published' : 'Hid'} library document: ${documentData.title}`, 
        documentData.id
      );
      
      toast({ 
        title: isHidden ? "Record Published" : "Record Hidden",
        description: isHidden ? "Document is now visible to students." : "Document has been hidden from student view."
      });
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (document: any) => {
    if (!firestore || !user) return;
    if (confirm(`Delete "${document.title}" permanently? This cannot be undone.`)) {
      try {
        deleteDocumentNonBlocking(doc(firestore, 'documents', document.id));
        if (document.fileUrl) {
          await deleteFromBlob(document.fileUrl);
        }
        logActivity(firestore, user.uid, 'DOCUMENT_DELETE', `Deleted document: ${document.title}`, document.id);
        toast({ title: "Document Deleted" });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    }
  };

  const getCategoryName = (catId: string) => {
    return categories?.find(c => c.id === catId)?.name || 'Uncategorized';
  };

  return (
    <div className="flex min-h-screen bg-zinc-50/30">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Institutional Library</h1>
              <p className="text-muted-foreground mt-1 text-lg">Manage official academic resources and announcements.</p>
            </div>
            <Button 
              onClick={() => { setEditingDoc(null); setIsDialogOpen(true); }}
              className="bg-primary text-white hover:bg-primary/90 rounded-full h-12 px-8 font-bold shadow-xl shadow-primary/20 transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Official Record
            </Button>
          </header>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-zinc-50 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="font-headline font-bold text-xl">Library Records</CardTitle>
                <CardDescription>Managing {filteredDocs?.length || 0} institutional files</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search resources..." 
                  className="pl-11 h-11 rounded-2xl bg-zinc-50 border-none focus-visible:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Visibility</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Category</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Last Modified</TableHead>
                      <TableHead className="font-bold text-right px-8 text-[10px] uppercase tracking-widest">Options</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs?.map((doc) => {
                      const isHidden = doc.visibilityStatus === 'hidden';
                      return (
                        <TableRow key={doc.id} className={cn(
                          "hover:bg-zinc-50/50 transition-colors border-zinc-50 group",
                          isHidden && "opacity-60 bg-zinc-50/30"
                        )}>
                          <TableCell className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                isHidden ? "bg-zinc-200 text-zinc-500" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                              )}>
                                {isHidden ? <EyeOff className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                              </div>
                              <div>
                                <p className="font-bold text-zinc-900 leading-tight">{doc.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB • PDF</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-[9px] font-bold uppercase tracking-widest px-3 py-1 border-none",
                              isHidden ? "bg-zinc-200 text-zinc-600" : "bg-green-100 text-green-700"
                            )}>
                              {isHidden ? <Lock className="h-3 w-3 mr-1.5" /> : <Globe className="h-3 w-3 mr-1.5" />}
                              {isHidden ? 'Hidden' : 'Published'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-none font-bold uppercase text-[9px] tracking-wider px-3 py-1">
                              {getCategoryName(doc.categoryId)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-[11px] text-zinc-500 font-bold uppercase">
                              {new Date(doc.updatedAt || doc.uploadDate || doc.createdAt).toLocaleDateString()}
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
                                <DropdownMenuItem 
                                  className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary font-medium"
                                  onClick={() => handleToggleVisibility(doc)}
                                >
                                  {isHidden ? (
                                    <><Eye className="h-4 w-4 mr-3" /> Publish Resource</>
                                  ) : (
                                    <><EyeOff className="h-4 w-4 mr-3" /> Hide from Library</>
                                  )}
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
