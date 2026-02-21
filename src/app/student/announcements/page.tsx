
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Calendar, Loader2, Ghost } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';

export default function StudentAnnouncements() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const announcementsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'announcements') : null, [firestore, user]);
  const { data: announcements, isLoading } = useCollection(announcementsQuery);

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="student" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header>
            <h1 className="text-3xl font-headline font-bold text-primary">CICS Announcements</h1>
            <p className="text-muted-foreground">Stay updated with official institutional news and broadcasts.</p>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
            </div>
          ) : !announcements || announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 text-center">
              <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                <Ghost className="h-10 w-10 text-zinc-300" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900">No active broadcasts</h3>
              <p className="text-muted-foreground max-w-sm mt-2">
                There are currently no new announcements or broadcasts for your program. Check back later for updates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {announcements.sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map((ann) => (
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
