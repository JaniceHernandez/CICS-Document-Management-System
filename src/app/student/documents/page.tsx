"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Loader2,
  X,
  ShieldCheck,
  Info,
  ArrowUpDown,
  Ghost
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where, limit } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';

export default function StudentDocuments() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
      return;
    }
    
    if (!isProfileLoading && userProfile && (!userProfile.programIds || userProfile.programIds.length === 0)) {
      router.push('/student/onboarding');
    }
  }, [user, isUserLoading, userProfile, isProfileLoading, router]);

  // Query only published documents to ensure strict visibility isolation
  const docsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'documents'), 
      where('visibilityStatus', '==', 'published'),
      limit(500)
    );
  }, [firestore, user]);

  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);

  const { data: documents, isLoading: isDocsLoading } = useCollection(docsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);

  const isLoading = isUserLoading || isProfileLoading || isDocsLoading;

  // Filter Logic:
  // 1. Institutional check: only files in cics-docs OR not in student-submissions
  // 2. Program match: Global documents (no ids) OR matches student's program
  const filteredDocs = documents?.filter(doc => {
    const isStudentSub = doc.fileUrl?.includes('student-submissions');
    if (isStudentSub) return false;

    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.categoryId === selectedCategory;
    
    const isGlobal = !doc.programIds || doc.programIds.length === 0;
    const isForStudentProgram = userProfile?.programIds?.some((pid: string) => doc.programIds?.includes(pid));
    
    return matchesSearch && matchesCategory && (isGlobal || isForStudentProgram);
  });

  const sortedDocs = filteredDocs?.sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime();
    }
    if (sortBy === 'downloads') {
      return (b.downloadCount || 0) - (a.downloadCount || 0);
    }
    if (sortBy === 'alpha') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  const handleDownload = (documentData: any) => {
    if (!firestore || !user || !documentData) return;

    logActivity(
      firestore, 
      user.uid, 
      'DOCUMENT_DOWNLOAD', 
      `${userProfile?.fullName || user.email} Downloaded Library Resource: ${documentData.title}`, 
      documentData.id
    );

    updateDocumentNonBlocking(doc(firestore, 'documents', documentData.id), {
      downloadCount: (documentData.downloadCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    const link = document.createElement('a');
    link.href = documentData.fileUrl;
    link.setAttribute('download', documentData.fileName);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "File Accessed",
      description: `Opening ${documentData.title}...`,
    });
  };

  const getCategoryName = (id: string) => categories?.find(c => c.id === id)?.name || 'Uncategorized';

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const studentProgramCode = userProfile?.programIds?.length > 0 
    ? programs?.find(p => p.id === userProfile.programIds[0])?.shortCode 
    : 'All Programs';

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="student" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Institutional Library</h1>
              <p className="text-muted-foreground">Access official resources for {studentProgramCode}.</p>
            </div>
            <div className="flex gap-4 items-center">
              {userProfile?.programIds?.length > 0 && (
                <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-2 text-primary font-bold text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  {studentProgramCode} Verified Portal
                </div>
              )}
            </div>
          </header>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search documents..." 
                    className="pl-10 h-11 rounded-xl bg-background border-zinc-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-zinc-200">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-zinc-200">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Sort By" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Uploaded</SelectItem>
                    <SelectItem value="downloads">Most Downloaded</SelectItem>
                    <SelectItem value="alpha">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground font-medium">Loading library collections...</p>
            </div>
          ) : sortedDocs && sortedDocs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedDocs.map((docData) => (
                <Card key={docData.id} className="border-none shadow-md rounded-2xl group overflow-hidden hover:shadow-xl transition-all bg-white border-t-4 border-t-secondary">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-full px-3 text-[10px] font-bold uppercase">
                        {getCategoryName(docData.categoryId)}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-headline font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {docData.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-3.5 w-3.5" />
                        {docData.downloadCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        PDF RESOURCE
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="rounded-full flex items-center gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all font-bold text-xs"
                        onClick={() => setPreviewDoc(docData)}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button 
                        className="rounded-full bg-secondary text-primary hover:bg-secondary/90 font-bold shadow-sm text-xs"
                        onClick={() => handleDownload(docData)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Get File
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <Ghost className="h-10 w-10 text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">No resources found</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                There are currently no documents matching your program ({studentProgramCode}) or search criteria.
              </p>
              <Button 
                variant="link" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-4 text-primary font-bold"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!previewDoc} onOpenChange={(open) => { if(!open) setPreviewDoc(null); }}>
        <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-3xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 relative">
            <div className="flex items-center justify-between pr-8">
              <div>
                <DialogTitle className="text-2xl font-headline font-bold">{previewDoc?.title}</DialogTitle>
                <DialogDescription className="text-white/70">
                  Institutional Resource • Uploaded {previewDoc && new Date(previewDoc.uploadDate).toLocaleDateString()}
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-10 w-10 p-0 rounded-full" 
              onClick={() => setPreviewDoc(null)}
            >
              <X className="h-6 w-6" />
            </Button>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-zinc-50">
            <div className="flex-1 bg-zinc-800 relative overflow-hidden">
              {previewDoc && (
                <iframe 
                  src={`${previewDoc.fileUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title={previewDoc.title}
                />
              )}
            </div>

            <div className="w-full md:w-80 bg-background border-l p-8 overflow-y-auto">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <Info className="h-5 w-5" />
                    Library Notes
                  </div>
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 shadow-inner">
                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                      {previewDoc?.description || "No description provided for this resource."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Category</span>
                    <Badge variant="outline" className="text-[10px] py-0">{getCategoryName(previewDoc?.categoryId)}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Data Size</span>
                    <span>{previewDoc && (previewDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Library Usage</span>
                    <span className="text-primary">{previewDoc?.downloadCount || 0} Downloads</span>
                  </div>
                </div>

                <div className="pt-6">
                  <Button 
                    className="w-full bg-secondary text-primary hover:bg-secondary/90 font-bold h-14 rounded-2xl shadow-xl shadow-secondary/20 transition-all hover:scale-[1.02]" 
                    onClick={() => handleDownload(previewDoc)}
                  >
                    <Download className="h-5 w-5 mr-3" />
                    Download Copy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
