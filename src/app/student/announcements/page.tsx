"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2, Ghost, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function StudentAnnouncements() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const announcementsQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'announcements') : null, [firestore, user]);
  const { data: announcements, isLoading: isAnnouncementsLoading } = useCollection(announcementsQuery);

  const isLoading = isUserLoading || isProfileLoading || isAnnouncementsLoading;

  const targetedAnnouncements = announcements?.filter(ann => {
    if (ann.status === 'hidden') return false;
    if (!ann.targetProgramIds || ann.targetProgramIds.length === 0) return true;
    if (!userProfile?.programIds || userProfile.programIds.length === 0) return false;
    return ann.targetProgramIds.some((pid: string) => userProfile.programIds.includes(pid));
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center p-20">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">CICS Announcements</h1>
            <p className="text-muted-foreground text-lg">Stay updated with official institutional news and broadcasts.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-zinc-100/50 px-4 py-2 rounded-2xl border border-zinc-200/50">
            <Info className="h-4 w-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Latest Posts: {targetedAnnouncements?.length || 0}
            </span>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest">Streaming Broadcasts...</p>
          </div>
        ) : !targetedAnnouncements || targetedAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <div className="w-24 h-24 bg-zinc-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
              <Ghost className="h-12 w-12 text-zinc-300" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-zinc-900">No active broadcasts</h3>
            <p className="text-muted-foreground max-w-sm mt-3 leading-relaxed">
              There are currently no new announcements or broadcasts targeted at your profile. Check back later for institutional updates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {targetedAnnouncements.sort((a,b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()).map((ann) => {
              const isExpanded = expandedIds.has(ann.id);
              return (
                <Card key={ann.id} className="border-none shadow-md rounded-3xl overflow-hidden bg-white hover:shadow-xl transition-all border-l-[6px] border-l-secondary">
                  <CardHeader className="p-8 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(ann.publishDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <Badge className="bg-primary/5 text-primary border-none rounded-full px-4 py-1 text-[9px] font-bold uppercase tracking-widest">
                        {ann.targetProgramIds && ann.targetProgramIds.length > 0 ? 'Targeted' : 'Institutional'}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-headline font-bold text-primary leading-tight">
                      {ann.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-0 space-y-6">
                    <div className={cn(
                      "text-zinc-700 leading-relaxed whitespace-pre-wrap text-base transition-all duration-300",
                      !isExpanded && "line-clamp-2"
                    )}>
                      {ann.content}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toggleExpand(ann.id)}
                      className="text-primary hover:bg-primary/5 p-0 h-auto font-bold flex items-center gap-2 transition-all hover:gap-3"
                    >
                      {isExpanded ? (
                        <>Collapse Post <ChevronUp className="h-4 w-4" /></>
                      ) : (
                        <>Expand Post Details <ChevronDown className="h-4 w-4" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}