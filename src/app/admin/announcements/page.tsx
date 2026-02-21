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
  Users
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
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { AnnouncementDialog } from '@/components/admin/announcement-dialog';
import { logActivity } from '@/lib/activity-logging';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
              <p className="text-muted-foreground mt-1 text-lg">Manage school announcements and news.</p>
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
                All Announcements
              </CardTitle>
              <CardDescription>Managing {announcements?.length || 0} active posts</CardDescription>
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
                      <TableHead className="font-bold px-8">Post Title</TableHead>
                      <TableHead className="font-bold">Audience</TableHead>
                      <TableHead className="font-bold">Date</TableHead>
                      <TableHead className="font-bold text-right px-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {announcements?.sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map((ann) => (
                      <TableRow key={ann.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50">
                        <TableCell className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center">
                              <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-zinc-900 leading-tight">{ann.title}</p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1 max-w-md">{ann.content}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-secondary text-primary font-bold text-[10px] px-3 py-1">
                            <Users className="h-3 w-3 mr-1" />
                            {getProgramCodes(ann.targetProgramIds)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-zinc-700">{format(new Date(ann.publishDate), 'MMM dd, yyyy')}</span>
                            <span className="text-[10px] text-muted-foreground">{format(new Date(ann.publishDate), 'hh:mm a')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                              <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-3">Manage</DropdownMenuLabel>
                              <DropdownMenuItem 
                                className="rounded-xl cursor-pointer"
                                onClick={() => { setEditingAnn(ann); setIsDialogOpen(true); }}
                              >
                                <Edit className="h-4 w-4 mr-3" /> Edit Post
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="rounded-xl text-destructive cursor-pointer"
                                onClick={() => handleDelete(ann)}
                              >
                                <Trash2 className="h-4 w-4 mr-3" /> Delete
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
