
"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Plus, 
  Bell, 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AnnouncementDialog } from '@/components/admin/announcement-dialog';
import { logActivity } from '@/lib/activity-logging';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function AdminAnnouncements() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnn, setEditingAnn] = useState<any>(null);

  const announcementsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'announcements') : null, [firestore, user]);
  const programsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'programs') : null, [firestore, user]);

  const { data: announcements, isLoading } = useCollection(announcementsQuery);
  const { data: programs } = useCollection(programsQuery);

  const handleDelete = (ann: any) => {
    if (!firestore || !user) return;
    if (confirm(`Delete announcement: "${ann.title}"?`)) {
      deleteDocumentNonBlocking(doc(firestore, 'announcements', ann.id));
      logActivity(firestore, user.uid, 'ANNOUNCEMENT_DELETE', `Deleted announcement: ${ann.title}`);
      toast({ title: "Announcement Removed" });
    }
  };

  const toggleVisibility = (ann: any) => {
    if (!firestore || !user) return;
    const isHidden = ann.status === 'hidden';
    const newStatus = isHidden ? 'published' : 'hidden';
    
    updateDocumentNonBlocking(doc(firestore, 'announcements', ann.id), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    logActivity(
      firestore, 
      user.uid, 
      'ANNOUNCEMENT_EDIT', 
      `${isHidden ? 'Restored' : 'Hid'} announcement: ${ann.title}`
    );
    
    toast({ 
      title: isHidden ? "Post Published" : "Post Hidden",
      description: isHidden ? "Students can now view this post." : "This post is no longer visible to students."
    });
  };

  const getProgramCodes = (progIds: string[]) => {
    if (!progIds || progIds.length === 0) return 'All Students';
    return progIds.map(id => programs?.find(p => p.id === id)?.shortCode).join(', ');
  };

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Announcements</h1>
              <p className="text-muted-foreground mt-1 text-lg">Manage school announcements and news visibility.</p>
            </div>
            <Button 
              onClick={() => { setEditingAnn(null); setIsDialogOpen(true); }}
              className="bg-secondary text-primary hover:bg-secondary/90 rounded-full h-12 px-8 font-bold shadow-xl shadow-secondary/30 transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Announcement
            </Button>
          </header>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-zinc-50">
              <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                <Bell className="h-6 w-6 text-primary" />
                Broadcast Registry
              </CardTitle>
              <CardDescription>Managing {announcements?.length || 0} institutional updates</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-32 flex flex-col items-center">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="mt-4 text-muted-foreground font-medium">Fetching posts...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-zinc-50/50">
                    <TableRow className="border-none">
                      <TableHead className="font-bold px-8 uppercase text-[10px] tracking-widest">Broadcast Details</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest">Target Audience</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="font-bold uppercase text-[10px] tracking-widest">Date Published</TableHead>
                      <TableHead className="font-bold text-right px-8 uppercase text-[10px] tracking-widest">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements?.sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map((ann) => (
                      <TableRow key={ann.id} className={cn(
                        "hover:bg-zinc-50/50 transition-colors border-zinc-50 group",
                        ann.status === 'hidden' && "opacity-60 bg-zinc-50/30"
                      )}>
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                              ann.status === 'hidden' ? "bg-zinc-200 text-zinc-500" : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                            )}>
                              {ann.status === 'hidden' ? <EyeOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 leading-tight group-hover:text-primary transition-colors">{ann.title}</p>
                              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 max-w-xs">{ann.content}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-secondary text-primary font-bold text-[9px] px-3 py-1 uppercase tracking-wider">
                            <Users className="h-3 w-3 mr-1.5" />
                            {getProgramCodes(ann.targetProgramIds)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-3 py-1 border-none",
                            ann.status === 'hidden' ? "bg-zinc-200 text-zinc-600" : "bg-green-100 text-green-700"
                          )}>
                            {ann.status || 'published'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-700">{format(new Date(ann.publishDate), 'MMM dd, yyyy')}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">{format(new Date(ann.publishDate), 'hh:mm a')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-zinc-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-none shadow-2xl">
                              <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-widest">Quick Actions</DropdownMenuLabel>
                              <DropdownMenuItem 
                                className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary font-medium"
                                onClick={() => { setEditingAnn(ann); setIsDialogOpen(true); }}
                              >
                                <Edit className="h-4 w-4 mr-3" /> Edit Broadcast
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary font-medium"
                                onClick={() => toggleVisibility(ann)}
                              >
                                {ann.status === 'hidden' ? (
                                  <><Eye className="h-4 w-4 mr-3" /> Restore Post</>
                                ) : (
                                  <><EyeOff className="h-4 w-4 mr-3" /> Hide Post</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-2 bg-zinc-50" />
                              <DropdownMenuItem 
                                className="rounded-xl text-destructive cursor-pointer py-3 focus:bg-destructive focus:text-white font-medium"
                                onClick={() => handleDelete(ann)}
                              >
                                <Trash2 className="h-4 w-4 mr-3" /> Delete Permanently
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
        </div>

        <AnnouncementDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          announcement={editingAnn}
        />
      </main>
    </div>
  );
}
