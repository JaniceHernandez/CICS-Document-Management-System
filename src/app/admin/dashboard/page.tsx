
"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Users, FileText, Download, TrendingUp, Bell, Plus, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { AnnouncementDialog } from '@/components/admin/announcement-dialog';

const COLORS = ['#003366', '#FFD700', '#004080', '#FFC107', '#002244'];

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isAnnOpen, setIsAnnOpen] = useState(false);

  const activityLogsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(8));
  }, [firestore, user]);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users');
  }, [firestore, user]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'documents');
  }, [firestore, user]);

  const inquiriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'inquiries');
  }, [firestore, user]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'categories');
  }, [firestore, user]);

  const { data: recentLogs, isLoading: logsLoading } = useCollection(activityLogsQuery);
  const { data: allUsers } = useCollection(studentsQuery);
  const { data: allDocs } = useCollection(documentsQuery);
  const { data: allInquiries } = useCollection(inquiriesQuery);
  const { data: allCategories } = useCollection(categoriesQuery);

  const studentCount = allUsers?.filter(u => u.role === 'Student').length || 0;
  const docCount = allDocs?.length || 0;
  const totalDownloads = allDocs?.reduce((acc, d) => acc + (d.downloadCount || 0), 0) || 0;
  const activeInquiries = allInquiries?.filter(i => i.status !== 'Resolved').length || 0;

  // Pie chart data based on categories
  const categoryStats = allCategories?.map(cat => ({
    name: cat.name,
    value: allDocs?.filter(d => d.categoryId === cat.id).length || 0
  })).filter(stat => stat.value > 0) || [];

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">System Overview</h1>
              <p className="text-muted-foreground">Real-time metrics and institutional activity.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsAnnOpen(true)}
                className="bg-secondary text-primary hover:bg-secondary/90 rounded-full font-bold px-6 shadow-lg shadow-secondary/20"
              >
                <Plus className="h-5 w-5 mr-2" />
                Post Announcement
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Students', value: studentCount.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Documents', value: docCount.toString(), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Downloads', value: totalDownloads.toString(), icon: Download, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Active Inquiries', value: activeInquiries.toString(), icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm rounded-2xl">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-xl", stat.bg)}>
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b">
                <CardTitle className="font-headline font-bold flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Library Distribution
                </CardTitle>
                <CardDescription>Documents across classification categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px] p-6">
                {categoryStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground italic">
                    No document categorization data available.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden flex flex-col">
              <CardHeader className="bg-white border-b">
                <CardTitle className="font-headline font-bold flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-primary" />
                  Recent System Events
                </CardTitle>
                <CardDescription>Live audit trail of administrative actions</CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto max-h-[350px]">
                {logsLoading ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y">
                    {recentLogs?.map((log) => (
                      <div key={log.id} className="px-6 py-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <div>
                            <p className="text-sm font-bold">{log.actionType.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground bg-zinc-100 px-2 py-1 rounded-full whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {recentLogs?.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground italic">
                        No activity recorded yet.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <AnnouncementDialog 
          open={isAnnOpen} 
          onOpenChange={setIsAnnOpen} 
        />
      </main>
    </div>
  );
}
