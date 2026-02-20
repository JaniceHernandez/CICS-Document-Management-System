
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
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Users, FileText, Download, TrendingUp, Bell, Plus, Loader2, MessageSquare, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { AnnouncementDialog } from '@/components/admin/announcement-dialog';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';

const COLORS = ['#003366', '#FFD700', '#004080', '#FFC107', '#002244'];

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isAnnOpen, setIsAnnOpen] = useState(false);

  // Firestore Queries - Waiting for auth
  const activityLogsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore, user]);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), where('role', '==', 'Student'));
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

  const { data: logs, isLoading: logsLoading } = useCollection(activityLogsQuery);
  const { data: students } = useCollection(studentsQuery);
  const { data: allDocs } = useCollection(documentsQuery);
  const { data: allInquiries } = useCollection(inquiriesQuery);
  const { data: allCategories } = useCollection(categoriesQuery);

  // Dynamic Metrics - derived from real-time collections
  const studentCount = students?.length || 0;
  const docCount = allDocs?.length || 0;
  const totalDownloads = allDocs?.reduce((acc, d) => acc + (d.downloadCount || 0), 0) || 0;
  const activeInquiries = allInquiries?.filter(i => i.status !== 'Resolved').length || 0;

  // Pie chart data: Library distribution by category
  const categoryStats = allCategories?.map(cat => ({
    name: cat.name,
    value: allDocs?.filter(d => d.categoryId === cat.id).length || 0
  })).filter(stat => stat.value > 0) || [];

  // Trend Chart Data (Last 7 Days)
  const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();
  const trendData = last7Days.map(date => {
    const dayLogs = logs?.filter(log => isSameDay(new Date(log.timestamp), date)) || [];
    return {
      date: format(date, 'MMM dd'),
      logins: dayLogs.filter(l => l.actionType === 'LOGIN').length,
      downloads: dayLogs.filter(l => l.actionType === 'DOCUMENT_DOWNLOAD').length,
      uploads: dayLogs.filter(l => l.actionType === 'DOCUMENT_UPLOAD').length,
    };
  });

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">System Core</h1>
              <p className="text-muted-foreground mt-1 text-lg">Real-time institutional oversight and data synchronization.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => setIsAnnOpen(true)}
                className="bg-secondary text-primary hover:bg-secondary/90 rounded-full font-bold h-12 px-8 shadow-xl shadow-secondary/30 transition-all hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Announcement
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Students', value: studentCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'Documents', value: docCount, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100/50' },
              { label: 'Downloads', value: totalDownloads, icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
              { label: 'Open Inquiries', value: activeInquiries, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-100/50' },
            ].map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-4xl font-bold text-primary tabular-nums">{stat.value}</p>
                  </div>
                  <div className={cn("p-4 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("h-8 w-8", stat.color)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-zinc-50">
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                  <Activity className="h-6 w-6 text-primary" />
                  Activity Velocity
                </CardTitle>
                <CardDescription>Live tracking (Last 7 Days)</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] p-8">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#003366" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#003366" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#FFD700" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="logins" stroke="#003366" fillOpacity={1} fill="url(#colorLogins)" strokeWidth={3} name="Logins" />
                    <Area type="monotone" dataKey="downloads" stroke="#FFD700" fillOpacity={1} fill="url(#colorDownloads)" strokeWidth={3} name="Downloads" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-zinc-50">
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  Library Distribution
                </CardTitle>
                <CardDescription>Density by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] p-8 flex flex-col items-center justify-center">
                {categoryStats.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-4 w-full">
                      {categoryStats.slice(0, 4).map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-xs font-bold text-zinc-600 truncate">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 text-zinc-400">
                    <FileText className="h-12 w-12 opacity-20" />
                    <p className="text-sm italic">Synchronizing library data...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-zinc-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                  <Bell className="h-6 w-6 text-primary" />
                  Institutional Ledger
                </CardTitle>
                <CardDescription>Real-time system events</CardDescription>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {logsLoading ? (
                <div className="p-20 flex justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {logs?.map((log) => (
                    <div key={log.id} className="px-8 py-5 flex items-center justify-between hover:bg-zinc-50 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                          log.actionType === 'DOCUMENT_UPLOAD' ? "bg-blue-50 text-blue-600" :
                          log.actionType === 'DOCUMENT_DOWNLOAD' ? "bg-emerald-50 text-emerald-600" :
                          log.actionType === 'LOGIN' ? "bg-zinc-100 text-zinc-600" : "bg-purple-50 text-purple-600"
                        )}>
                          {log.actionType === 'DOCUMENT_UPLOAD' ? <Plus className="h-5 w-5" /> :
                           log.actionType === 'DOCUMENT_DOWNLOAD' ? <Download className="h-5 w-5" /> :
                           log.actionType === 'LOGIN' ? <Users className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                            {log.actionType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">{log.details}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                          {format(new Date(log.timestamp), 'hh:mm a')}
                        </span>
                        <span className="text-[10px] text-zinc-300 font-medium">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AnnouncementDialog 
          open={isAnnOpen} 
          onOpenChange={setIsAnnOpen} 
        />
      </main>
    </div>
  );
}
