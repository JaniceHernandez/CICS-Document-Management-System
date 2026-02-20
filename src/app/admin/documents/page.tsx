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
  CheckCircle2,
  Clock
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

export default function DocumentManagement() {
  const [isUploading, setIsUploading] = useState(false);

  const mockDocs = [
    { id: 1, title: 'BSIT Program Checklist 2024', category: 'Checklists', program: 'BSIT', lastModified: '2024-01-15', status: 'Published' },
    { id: 2, title: 'University Academic Calendar', category: 'General', program: 'All', lastModified: '2023-12-01', status: 'Published' },
    { id: 3, title: 'Student Code of Conduct', category: 'Policies', program: 'All', lastModified: '2023-08-20', status: 'Published' },
    { id: 4, title: 'CS Elective Guidelines', category: 'Guidelines', program: 'BSCS', lastModified: '2024-02-10', status: 'Draft' },
  ];

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
            <Button className="bg-primary text-white rounded-full h-11 px-6 font-bold shadow-lg shadow-primary/20">
              <Plus className="h-5 w-5 mr-2" />
              Upload New PDF
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b p-6 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline font-bold text-xl">Active Repository</CardTitle>
                  <CardDescription>Managing {mockDocs.length} official documents</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search repository..." className="pl-9 h-10 rounded-xl" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="font-bold">Document Name</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="font-bold">Program</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDocs.map((doc) => (
                      <TableRow key={doc.id} className="hover:bg-zinc-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/5 rounded-lg">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">Modified {doc.lastModified}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-zinc-100 text-zinc-900 border-none font-medium">
                            {doc.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-primary/20 text-primary">
                            {doc.program}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {doc.status === 'Published' ? (
                              <div className="flex items-center text-green-600 text-sm font-medium">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Published
                              </div>
                            ) : (
                              <div className="flex items-center text-amber-600 text-sm font-medium">
                                <Clock className="h-3 w-3 mr-1" />
                                Draft
                              </div>
                            )}
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
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <ExternalLink className="h-4 w-4 mr-2" /> View File
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive cursor-pointer hover:bg-destructive hover:text-white">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Document
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-2xl bg-zinc-900 text-white">
                <CardHeader>
                  <CardTitle className="font-headline font-bold flex items-center gap-2">
                    <Upload className="h-5 w-5 text-secondary" />
                    Bulk Upload
                  </CardTitle>
                  <CardDescription className="text-zinc-400">Drag and drop multiple PDFs here</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-secondary transition-colors cursor-pointer group">
                    <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center group-hover:bg-secondary group-hover:text-primary transition-colors">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-medium">Drop PDFs here</p>
                      <p className="text-sm text-zinc-500">or click to browse files</p>
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
                      <span className="font-bold">2.4 GB / 10 GB</span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[24%]" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your current plan supports up to 5,000 PDF documents. Contact IT Support for upgrades.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}