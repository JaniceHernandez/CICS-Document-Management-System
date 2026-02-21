"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Sparkles,
  Loader2,
  X
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
import { summarizeDocument } from '@/ai/flows/summarize-document';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';

export default function StudentDocuments() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { toast } = useToast();

  // Firestore Queries
  const docsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'documents') : null, [firestore, user]);
  const categoriesQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'categories') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);

  const { data: documents, isLoading } = useCollection(docsQuery);
  const { data: categories } = useCollection(categoriesQuery);
  const { data: programs } = useCollection(programsQuery);

  const filteredDocs = documents?.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.categoryId === selectedCategory;
    const matchesProgram = selectedProgram === 'all' || doc.programIds?.includes(selectedProgram);
    return matchesSearch && matchesCategory && matchesProgram;
  });

  const handleSummarize = async () => {
    if (!previewDoc) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      // Fetch the PDF file through the proxy to avoid CORS and get actual data
      const response = await fetch(`/api/blob?url=${encodeURIComponent(previewDoc.fileUrl)}`);
      if (!response.ok) throw new Error('Failed to fetch document');
      
      const blob = await response.blob();
      
      // Convert blob to Data URI for Genkit
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const pdfDataUri = await base64Promise;

      const result = await summarizeDocument({ pdfDataUri });
      setSummary(result.summary);
    } catch (error) {
      console.error('Summarization Error:', error);
      toast({
        title: "Summarization Error",
        description: "Could not generate summary at this time. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownload = (document: any) => {
    if (!firestore || !user) return;
    
    // Log download activity
    logActivity(firestore, user.uid, 'DOCUMENT_DOWNLOAD', `Downloaded: ${document.title}`, document.id);
    
    // Update download count - This is the action that was causing the permission error
    updateDocumentNonBlocking(doc(firestore, 'documents', document.id), {
      downloadCount: (document.downloadCount || 0) + 1,
      updatedAt: new Date().toISOString()
    });

    // Use proxy for download
    const proxyUrl = `/api/blob?url=${encodeURIComponent(document.fileUrl)}`;
    window.open(proxyUrl, '_blank');
  };

  const getCategoryName = (id: string) => categories?.find(c => c.id === id)?.name || 'Uncategorized';

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="student" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">CICS Document Library</h1>
              <p className="text-muted-foreground">Search and access official academic resources.</p>
            </div>
            <div className="flex gap-2 bg-primary/5 p-2 rounded-2xl items-center border border-primary/10">
              <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
              <span className="text-sm font-medium text-primary">AI Summarization Enabled</span>
            </div>
          </header>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search documents by name or keyword..." 
                    className="pl-10 h-11 rounded-xl bg-background border-zinc-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-zinc-200">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger className="h-11 rounded-xl bg-background border-zinc-200">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs?.map(prog => (
                      <SelectItem key={prog.id} value={prog.id}>{prog.shortCode}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">Loading academic documents...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredDocs?.map((doc) => (
                <Card key={doc.id} className="border-none shadow-md rounded-2xl group overflow-hidden hover:shadow-xl transition-all bg-white">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-full px-3">
                        {getCategoryName(doc.categoryId)}
                      </Badge>
                      <div className="flex gap-1">
                        {doc.programIds?.map((pid: string) => (
                          <Badge key={pid} variant="outline" className="border-primary/20 text-primary text-[10px] h-5">
                            {programs?.find(p => p.id === pid)?.shortCode}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-headline font-bold line-clamp-1 group-hover:text-primary transition-colors">
                      {doc.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Download className="h-4 w-4" />
                        {doc.downloadCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        PDF
                      </div>
                      <div className="text-xs">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        variant="outline" 
                        className="rounded-full flex items-center gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Button>
                      <Button 
                        className="rounded-full bg-secondary text-primary hover:bg-secondary/90 font-bold shadow-sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredDocs?.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <div className="bg-zinc-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-headline font-bold">No documents found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              <Button 
                variant="outline" 
                className="rounded-full"
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedProgram('all'); }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if(!open) { setPreviewDoc(null); setSummary(null); } }}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-3xl">
          <DialogHeader className="p-6 bg-primary text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-headline font-bold">{previewDoc?.title}</DialogTitle>
                <DialogDescription className="text-white/70">
                  Uploaded on {previewDoc && new Date(previewDoc.uploadDate).toLocaleDateString()}
                </DialogDescription>
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/20 h-10 w-10 p-0" onClick={() => setPreviewDoc(null)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Simulation of PDF Preview */}
            <div className="flex-1 bg-zinc-800 flex flex-col items-center justify-center text-white p-12 min-h-[400px]">
              <FileText className="h-24 w-24 opacity-20 mb-4" />
              <p className="text-center font-medium">Institutional PDF Viewer</p>
              <p className="text-sm text-zinc-400 max-w-xs text-center mt-2">Document is loaded securely from cloud storage.</p>
              <Button className="mt-8 bg-white text-primary hover:bg-zinc-100 rounded-full px-8" asChild>
                <a href={`/api/blob?url=${encodeURIComponent(previewDoc?.fileUrl || '')}`} target="_blank" rel="noopener noreferrer">
                  Open Document
                </a>
              </Button>
            </div>

            {/* AI Summary Panel */}
            <div className="w-full md:w-96 bg-background border-l p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  AI Assistant
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Document Insights</p>
                  {isSummarizing ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-primary/5 rounded-2xl border border-dashed border-primary/20">
                      <Loader2 className="h-10 w-10 text-primary animate-spin" />
                      <p className="text-xs text-primary font-medium text-center px-4">Analyzing content and extracting key takeaways...</p>
                    </div>
                  ) : summary ? (
                    <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 shadow-sm">
                      <p className="text-sm text-primary leading-relaxed">{summary}</p>
                    </div>
                  ) : (
                    <div className="bg-zinc-50 p-8 rounded-2xl text-center space-y-4 border border-zinc-100">
                      <p className="text-xs text-muted-foreground italic">Short on time? Let our AI summarize this document for you instantly.</p>
                      <Button 
                        onClick={handleSummarize}
                        className="w-full bg-primary text-white rounded-xl font-bold h-11"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Summarize Now
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t space-y-4">
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Available Actions</p>
                  <Button className="w-full bg-secondary text-primary font-bold h-12 rounded-xl shadow-sm" onClick={() => handleDownload(previewDoc)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download for Offline
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