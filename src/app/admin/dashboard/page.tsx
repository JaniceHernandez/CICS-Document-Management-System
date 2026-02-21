
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
  Area,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  Users, 
  FileText, 
  Download, 
  TrendingUp, 
  Loader2, 
  MessageSquare, 
  Activity, 
  Calendar,
  FileDown,
  ArrowUpRight,
  Filter,
  MousePointer2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import { format, subDays, isSameDay, startOfDay, subMonths, isWithinInterval } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#003366', '#FFD700', '#004080', '#FFC107', '#002244'];

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [timeRange, setTimeRange] = useState('7d');

  // Firestore Queries
  const activityLogsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(100));
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

  // Engagement Metrics
  const studentCount = students?.length || 0;
  const docCount = allDocs?.length || 0;
  const totalDownloads = allDocs?.reduce((acc, d) => acc + (d.downloadCount || 0), 0) || 0;
  const activeInquiries = allInquiries?.filter(i => i.status !== 'Resolved').length || 0;

  // Trend Data Generation based on TimeRange
  const getTrendData = () => {
    const now = new Date();
    let days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const interval = Array.from({ length: days }, (_, i) => subDays(now, i)).reverse();
    
    return interval.map(date => {
      const dayLogs = logs?.filter(log => isSameDay(new Date(log.timestamp), date)) || [];
      return {
        date: format(date, days > 30 ? 'MMM dd' : 'MMM dd'),
        logins: dayLogs.filter(l => l.actionType === 'LOGIN').length,
        downloads: dayLogs.filter(l => l.actionType === 'DOCUMENT_DOWNLOAD').length,
        engagements: dayLogs.length
      };
    });
  };

  const trendData = getTrendData();

  // Category Distribution for Pie
  const categoryStats = allCategories?.map(cat => ({
    name: cat.name,
    value: allDocs?.filter(d => d.categoryId === cat.id).length || 0
  })).filter(stat => stat.value > 0) || [];

  // Export Logic
  const exportToCSV = () => {
    if (!logs) return;
    const headers = ['Action', 'Details', 'Timestamp', 'User ID'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.actionType,
        `"${log.details.replace(/"/g, '""')}"`,
        log.timestamp,
        log.userId
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `cics_activity_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Analytics Engine</h1>
              <p className="text-muted-foreground mt-1 text-lg">Real-time engagement telemetry and system performance audit.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={exportToCSV}
                className="rounded-full h-12 px-6 border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold"
              >
                <FileDown className="h-5 w-5 mr-2" />
                Export Ledger (CSV)
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Registered Students', value: studentCount, icon: Users, trend: '+12% from last month', color: 'text-blue-600', bg: 'bg-blue-100/50' },
              { label: 'Knowledge Assets', value: docCount, icon: FileText, trend: '+5 new this week', color: 'text-purple-600', bg: 'bg-purple-100/50' },
              { label: 'Access Events', value: totalDownloads, icon: Download, trend: 'Peak: 128/day', color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
              { label: 'Support Queue', value: activeInquiries, icon: MessageSquare, trend: 'Avg response: 18h', color: 'text-amber-600', bg: 'bg-amber-100/50' },
            ].map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-4 rounded-2xl", stat.bg)}>
                      <stat.icon className={cn("h-6 w-6", stat.color)} />
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      {stat.trend}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-4xl font-bold text-primary tabular-nums">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="7d" className="w-full" onValueChange={setTimeRange}>
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-white border p-1 rounded-2xl h-12 shadow-sm">
                <TabsTrigger value="7d" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Weekly</TabsTrigger>
                <TabsTrigger value="30d" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Monthly</TabsTrigger>
                <TabsTrigger value="90d" className="rounded-xl px-6 data-[state=active]:bg-primary data-[state=active]:text-white">Quarterly</TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <Calendar className="h-4 w-4" />
                Live Feed Active
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-zinc-50">
                  <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Engagement Velocity
                  </CardTitle>
                  <CardDescription>Comparative analysis of logins vs resource access events</CardDescription>
                </CardHeader>
                <CardContent className="h-[450px] p-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#888', fontSize: 11}} 
                        dy={10}
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
                      <Line type="monotone" dataKey="logins" stroke="#003366" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} name="Logins" />
                      <Line type="monotone" dataKey="downloads" stroke="#FFD700" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 8 }} name="Downloads" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-zinc-50">
                  <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                    <MousePointer2 className="h-6 w-6 text-primary" />
                    Action Intensity
                  </CardTitle>
                  <CardDescription>Total daily interactions</CardDescription>
                </CardHeader>
                <CardContent className="h-[450px] p-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} />
                      <Tooltip 
                        cursor={{fill: '#f8f8f8'}}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="engagements" fill="#003366" radius={[6, 6, 0, 0]} name="Interactions" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </Tabs>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-zinc-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                  <Activity className="h-6 w-6 text-primary" />
                  System Audit Ledger
                </CardTitle>
                <CardDescription>Recording all institutional events for security monitoring</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="rounded-full text-zinc-400">View Full History</Button>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="p-0 max-h-[500px] overflow-y-auto">
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
                          {log.actionType === 'DOCUMENT_UPLOAD' ? <FileText className="h-5 w-5" /> :
                           log.actionType === 'DOCUMENT_DOWNLOAD' ? <Download className="h-5 w-5" /> :
                           log.actionType === 'LOGIN' ? <Users className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                            {log.actionType.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">{log.details}</p>
                          <p className="text-[10px] text-zinc-300 font-mono mt-1">ID: {log.userId.slice(0, 8)}...</p>
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
      </main>
    </div>
  );
}
