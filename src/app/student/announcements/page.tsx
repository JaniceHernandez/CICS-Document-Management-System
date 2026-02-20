"use client";

import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Calendar, Tag, ChevronRight, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function StudentAnnouncements() {
  const firestore = useFirestore();
  const { user } = useUser();

  const announcementsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'announcements') : null, [firestore, user]);
  const { data: announcements, isLoading } = useCollection(announcementsQuery);

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="student" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary">CICS Announcements</h1>
            <p className="text-muted-foreground">Stay updated with official college news and broadcasts.</p>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          ) : announcements?.length === 0 ? (
            <Card className="border-none shadow-sm rounded-3xl p-12 text-center bg-white">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="h-10 w-10 text-zinc-300" />
              </div>
              <p className="text-muted-foreground">No current announcements to display.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {announcements?.sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map((ann) => (
                <Card key={ann.id} className="border-none shadow-md rounded-2xl overflow-hidden bg-white hover:shadow-xl transition-all border-l-4 border-l-secondary">
                  <CardHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(ann.publishDate).toLocaleDateString()}
                      </div>
                      <Badge className="bg-primary/5 text-primary border-none rounded-full px-3">
                        Official Broadcast
                      </Badge>
                    </div>
                    <CardTitle className="text-xl font-headline font-bold text-primary leading-tight">
                      {ann.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-2">
                    <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                      {ann.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
