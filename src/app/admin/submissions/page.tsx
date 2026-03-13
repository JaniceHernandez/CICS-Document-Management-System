
"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  FileText, 
  ExternalLink,
  Loader2,
  User,
  Search,
  CheckCircle2,
  Trash2,
  MoreVertical,
  Inbox,
  Clock,
  CheckCircle
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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { deleteFromBlob } from '@/app/actions/storage';
import { logActivity } from '@/lib/activity-logging';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminSubmissions() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const documentsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'documents') : null, [firestore, adminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);
  const categoriesQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'categories') : null, [firestore, adminUser]);

  const { data: documents, isLoading: docsLoading } = useCollection(documentsQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: categories } = useCollection(categoriesQuery);

  // Segregation: Only show documents from the 'student-submissions' folder
  const studentSubmissions = documents?.filter(doc => {
    return doc.fileUrl?.includes('student-submissions');
  }) || [];

  const filteredSubmissions = studentSubmissions.filter(sub => 
    sub.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    users?.find(u => u.id === sub.uploaderId)?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());

  const handleAcknowledge = async (document: any) => {
    if (!firestore || !adminUser) return;
    try {
      await updateDoc(doc(firestore, 'documents', document.id), {
        status: 'Acknowledged',
        updatedAt: new Date().toISOString()
      });
      logActivity(firestore, adminUser.uid, 'DOCUMENT_EDIT', `Admin acknowledged receipt: ${document.title}`, document.id);
      toast({ title: "Filing Acknowledged", description: "The student will be notified of this update." });
    } catch (e: any) {
      toast({ title: "Update Failed", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (document: any) => {
    if (!firestore || !adminUser) return;
    if (confirm(`Delete student requirement filing "${document.title}"? This will permanently remove the record.`)) {
      try {
        await deleteDoc(doc(firestore, 'documents', document.id));
        if (document.fileUrl) {
          await deleteFromBlob(document.fileUrl);
        }
        logActivity(firestore, adminUser.uid, 'DOCUMENT_DELETE', `Admin removed student filing: ${document.title}`, document.id);
        toast({ title: "Filing Removed" });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    }
  };

  const getUploaderName = (uid: string) => {
    const found = users?.find(u => u.id === uid);
    return found?.fullName || found?.email || 'Unknown Student';
  };

  const getCategoryName = (catId: string) => {
    return categories?.find(c => c.id === catId)?.name || 'Requirement';
  };

  return (
    <div className="flex min-h-screen bg-zinc-50/30">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Student Requirement Filings</h1>
            <p className="text-muted-foreground mt-1 text-lg">Review and monitor official documents submitted by students for compliance.</p>
          </header>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-zinc-50 flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                  <Inbox className="h-6 w-6 text-primary" />
                  Submission Inbox
                </CardTitle>
                <CardDescription>{studentSubmissions.length} active requirement filings pending review</CardDescription>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search filings or students..." 
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
                  <p className="text-muted-foreground font-medium">Scanning filing system...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-32">
                  <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-zinc-300" />
                  </div>
                  <p className="text-muted-foreground font-medium">No requirement filings found matching your search.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-none">
                      <TableHead className="font-bold px-8 text-[10px] uppercase tracking-widest">Filed Document</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Student</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Date Filed</TableHead>
                      <TableHead className="font-bold text-right px-8 text-[10px] uppercase tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50 group">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 leading-tight">{sub.title}</p>
                              <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">{getCategoryName(sub.categoryId)} • {(sub.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-zinc-100 rounded-full flex items-center justify-center">
                              <User className="h-3.5 w-3.5 text-zinc-500" />
                            </div>
                            <span className="text-xs font-bold text-zinc-700">{getUploaderName(sub.uploaderId)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={cn(
                            "border-none font-bold uppercase text-[9px] tracking-wider px-3 py-1 flex items-center gap-1.5 w-fit",
                            sub.status === 'Acknowledged' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          )}>
                            {sub.status === 'Acknowledged' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {sub.status || 'Pending Review'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-[11px] text-zinc-500 font-bold uppercase">
                            {new Date(sub.uploadDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <div className="flex items-center justify-end gap-2">
                            {sub.status !== 'Acknowledged' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleAcknowledge(sub)}
                                className="rounded-xl h-9 border-zinc-200 text-primary font-bold text-xs hover:bg-primary hover:text-white"
                              >
                                Acknowledge
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 h-10 w-10">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                                <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-widest">Review Filing</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary font-medium" asChild>
                                  <a href={`/api/blob?url=${encodeURIComponent(sub.fileUrl)}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-3" /> View Official Filing
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="my-2 bg-zinc-50" />
                                <DropdownMenuItem 
                                  className="rounded-xl text-destructive cursor-pointer py-3 focus:bg-destructive focus:text-white font-medium"
                                  onClick={() => handleDelete(sub)}
                                >
                                  <Trash2 className="h-4 w-4 mr-3" /> Deny & Remove Filing
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
