"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Eye, 
  Sparkles,
  ChevronRight,
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

const MOCK_DOCS = [
  { id: 1, title: 'BSIT Program Checklist 2024', category: 'Checklists', program: 'BSIT', date: '2024-01-15', downloads: 450 },
  { id: 2, title: 'University Academic Calendar', category: 'General', program: 'All', date: '2023-12-01', downloads: 1200 },
  { id: 3, title: 'Student Code of Conduct', category: 'Policies', program: 'All', date: '2023-08-20', downloads: 850 },
  { id: 4, title: 'CS Elective Guidelines', category: 'Guidelines', program: 'BSCS', date: '2024-02-10', downloads: 230 },
  { id: 5, title: 'Laboratory Safety Manual', category: 'Guidelines', program: 'All', date: '2023-09-05', downloads: 560 },
  { id: 6, title: 'Internship Requirements v2', category: 'Forms', program: 'BSIT', date: '2024-02-28', downloads: 340 },
];

export default function StudentDocuments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [previewDoc, setPreviewDoc] = useState<typeof MOCK_DOCS[0] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredDocs = MOCK_DOCS.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesProgram = selectedProgram === 'all' || doc.program.toLowerCase() === selectedProgram.toLowerCase();
    return matchesSearch && matchesCategory && matchesProgram;
  });

  const handleSummarize = async () => {
    if (!previewDoc) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      // Simulation of PDF Data URI for the flow
      const mockPdfDataUri = "data:application/pdf;base64,JVBERi0xLjQKJ..." 
      const result = await summarizeDocument({ pdfDataUri: mockPdfDataUri });
      setSummary(result.summary);
    } catch (error) {
      toast({
        title: "Summarization Error",
        description: "Could not generate summary at this time.",
        variant: "destructive"
      });
    } finally {
      setIsSummarizing(false);
    }
  };

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
            <div className="flex gap-2 bg-primary/5 p-2 rounded-2xl items-center">
              <Sparkles className="h-5 w-5 text-secondary animate-pulse" />
              <span className="text-sm font-medium text-primary">AI Summarization Enabled</span>
            </div>
          </header>

          <Card className="border-none shadow-sm rounded-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="Search documents by name or keyword..." 
                    className="pl-10 h-11 rounded-xl bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-11 rounded-xl bg-background">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="checklists">Checklists</SelectItem>
                    <SelectItem value="policies">Policies</SelectItem>
                    <SelectItem value="guidelines">Guidelines</SelectItem>
                    <SelectItem value="forms">Forms</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                  <SelectTrigger className="h-11 rounded-xl bg-background">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    <SelectItem value="bsit">BSIT</SelectItem>
                    <SelectItem value="bscs">BSCS</SelectItem>
                    <SelectItem value="bsis">BSIS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="border-none shadow-md rounded-2xl group overflow-hidden hover:shadow-xl transition-all">
                <CardHeader className="p-6 pb-2">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-full px-3">
                      {doc.category}
                    </Badge>
                    <Badge variant="outline" className="border-primary/20 text-primary font-bold">
                      {doc.program}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-headline font-bold line-clamp-1 group-hover:text-primary transition-colors">
                    {doc.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {doc.downloads} downloads
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      PDF
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="rounded-full flex items-center gap-2 border-primary/20 text-primary hover:bg-primary hover:text-white"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button 
                      className="rounded-full bg-secondary text-primary hover:bg-secondary/90 font-bold"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocs.length === 0 && (
            <div className="text-center py-20 space-y-4">
              <div className="bg-zinc-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-headline font-bold">No documents found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedProgram('all'); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if(!open) { setPreviewDoc(null); setSummary(null); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-3xl">
          <DialogHeader className="p-6 bg-primary text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-headline font-bold">{previewDoc?.title}</DialogTitle>
                <DialogDescription className="text-white/70">
                  Last updated {previewDoc?.date} • {previewDoc?.program}
                </DialogDescription>
              </div>
              <Button variant="ghost" className="text-white hover:bg-white/20" onClick={() => setPreviewDoc(null)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col md:flex-row h-full">
            {/* Simulation of PDF Preview */}
            <div className="flex-1 bg-zinc-800 flex flex-col items-center justify-center text-white p-12 min-h-[400px]">
              <FileText className="h-24 w-24 opacity-20 mb-4" />
              <p className="text-center font-medium">Official PDF Viewer Simulation</p>
              <p className="text-sm text-zinc-400 max-w-xs text-center mt-2">In a production environment, this area would render the actual PDF document for viewing.</p>
              <Button className="mt-8 bg-white text-primary hover:bg-zinc-100">
                Open in New Tab
              </Button>
            </div>

            {/* AI Summary Panel */}
            <div className="w-full md:w-80 bg-background border-l p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Sparkles className="h-5 w-5" />
                  AI Assistant
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm font-medium">Quick Summary</p>
                  {isSummarizing ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                      <p className="text-xs text-muted-foreground text-center">Reading document and generating highlights...</p>
                    </div>
                  ) : summary ? (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <p className="text-sm text-primary leading-relaxed">{summary}</p>
                    </div>
                  ) : (
                    <div className="bg-muted p-6 rounded-xl text-center space-y-3">
                      <p className="text-xs text-muted-foreground italic">Need a quick overview of this document?</p>
                      <Button 
                        onClick={handleSummarize}
                        className="w-full bg-primary text-white text-xs h-9 rounded-lg"
                      >
                        Generate Summary
                      </Button>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t space-y-4">
                  <p className="text-sm font-medium">Actions</p>
                  <Button className="w-full bg-secondary text-primary font-bold h-11 rounded-xl">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
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