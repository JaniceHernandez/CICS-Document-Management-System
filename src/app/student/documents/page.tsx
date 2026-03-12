
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, getDoc } from 'firebase/firestore';
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function checkOnboarding() {
      if (!isUserLoading && !user) {
        router.push('/login');
        return;
      }

      if (user && firestore) {
        const userSnap = await getDoc(doc(firestore, 'users', user.uid));
        const userData = userSnap.data();
        setUserProfile(userData);

        if (!userData?.programIds || userData.programIds.length === 0) {
          router.push('/student/onboarding');
          return;
        }
      }
    }
    checkOnboarding();
  }, [user, isUserLoading, firestore, router]);

  const docsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'documents') : null, [firestore, user]);
  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);

  const { data: documents, isLoading } = useCollection(docsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);

  // Filtering Logic: Only show documents for the student's program(s) OR "All Programs" (Global)
  const filteredDocs = documents?.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.categoryId === selectedCategory;
    
    // Check if document is Global or matches the student's program(s)
    const isGlobal = !doc.programIds || doc.programIds.length === 0;
    const isForStudentProgram = userProfile?.programIds?.some((pid: string) => doc.programIds?.includes(pid));
    
    const matchesProgram = isGlobal || isForStudentProgram;

    return matchesSearch && matchesCategory && matchesProgram;
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
      `${userProfile?.fullName || user.email} Downloaded Document: ${documentData.title}`, 
      documentData.id
    );

    updateDocumentNonBlocking(doc(firestore, 'documents', documentData.id), {
      downloadCount: (documentData.downloadCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    const downloadUrl = `/api/blob?url=${encodeURIComponent(documentData.fileUrl)}&download=true`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', documentData.fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Initiated",
      description: `Downloading ${documentData.title}...`,
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
              <h1 className="text-3xl font-headline font-bold text-primary">Library</h1>
              <p className="text-muted-foreground">Access institutional resources for {studentProgramCode}.</p>
            </div>
            <div className="flex gap-4 items-center">
              {userProfile?.programIds?.length > 0 && (
                <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">
                    {studentProgramCode} Portal
                  </span>
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
                <Card key={docData.id} className="border-none shadow-md rounded-2xl group overflow-hidden hover:shadow-xl transition-all bg-white">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-full px-3">
                        {getCategoryName(docData.categoryId)}
                      </Badge>
                      {docData.uploaderId === user?.uid && (
                        <Badge variant="outline" className="border-secondary text-primary font-bold text-[9px]">YOUR SUBMISSION</Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl font-headline font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {docData.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {docData.downloadCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        PDF
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="rounded-full flex items-center gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                        onClick={() => setPreviewDoc(docData)}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button 
                        className="rounded-full bg-secondary text-primary hover:bg-secondary/90 font-bold shadow-sm"
                        onClick={() => handleDownload(docData)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
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
                  Uploaded on {previewDoc && new Date(previewDoc.uploadDate).toLocaleDateString()}
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
                  src={`/api/blob?url=${encodeURIComponent(previewDoc.fileUrl)}#toolbar=0`}
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
                    Description
                  </div>
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 shadow-inner">
                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                      {previewDoc?.description || "No description provided."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Category</span>
                    <Badge variant="outline" className="text-[10px] py-0">{getCategoryName(previewDoc?.categoryId)}</Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Size</span>
                    <span>{previewDoc && (previewDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <span>Downloads</span>
                    <span className="text-primary">{previewDoc?.downloadCount || 0}</span>
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
