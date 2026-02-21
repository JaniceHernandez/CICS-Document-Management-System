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
  LineChart,
  Line,
  Legend,
  Cell
} from 'recharts';
import { 
  Users, 
  FileText, 
  Download, 
  TrendingUp, 
  Loader2, 
  Activity, 
  FileDown,
  MousePointer2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = ['#003366', '#FFD700', '#004080', '#FFC107', '#002244'];

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [timeRange, setTimeRange] = useState('weekly');

  const activityLogsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(500));
  }, [firestore, user]);

  const allUsersQuery = useMemoFirebase(() => {
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

  const { data: logs, isLoading: logsLoading } = useCollection(activityLogsQuery);
  const { data: users } = useCollection(allUsersQuery);
  const { data: allDocs } = useCollection(documentsQuery);
  const { data: allInquiries } = useCollection(inquiriesQuery);
  const { data: allCategories } = useCollection(categoriesQuery);

  const studentCount = users?.filter(u => u.role === 'Student').length || 0;
  const docCount = allDocs?.length || 0;
  const totalDownloads = allDocs?.reduce((acc, d) => acc + (d.downloadCount || 0), 0) || 0;
  const activeInquiries = allInquiries?.filter(i => i.status !== 'Resolved').length || 0;

  const getTrendData = () => {
    const today = startOfDay(new Date());
    let days = timeRange === 'weekly' ? 7 : timeRange === 'monthly' ? 30 : 90;
    
    const interval = Array.from({ length: days }, (_, i) => subDays(today, i)).reverse();
    
    return interval.map(date => {
      const dayLogs = logs?.filter(log => isSameDay(new Date(log.timestamp), date)) || [];
      return {
        date: format(date, days > 30 ? 'MMM dd' : 'MMM dd'),
        logins: dayLogs.filter(l => l.actionType === 'LOGIN').length,
        downloads: dayLogs.filter(l => l.actionType === 'DOCUMENT_DOWNLOAD').length,
      };
    });
  };

  const trendData = getTrendData();

  const categoryStats = allCategories?.map(cat => ({
    name: cat.name,
    count: allDocs?.filter(d => d.categoryId === cat.id).length || 0
  })).sort((a, b) => b.count - a.count) || [];

  const exportToCSV = () => {
    if (!logs) return;
    
    const summary = [
      ['Dashboard Summary Report'],
      ['Registered Students', studentCount],
      ['Documents Hosted', docCount],
      ['Total Downloads', totalDownloads],
      ['Active Inquiries', activeInquiries],
      ['Generated On', new Date().toLocaleString()],
      [''],
      ['Activity History']
    ];

    const headers = ['Action', 'Name', 'Description', 'Time'];
    const rows = logs.map(log => {
      const userName = users?.find(u => u.id === log.userId)?.fullName || 'System';
      return [
        log.actionType,
        userName,
        `"${log.details.replace(/"/g, '""')}"`,
        log.timestamp
      ];
    });

    const csvContent = [
      ...summary.map(row => row.join(',')),
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard_report_${format(new Date(), 'yyyyMMdd')}.csv`);
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

  const stats = [
    { label: 'Registered Students', value: studentCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100/50' },
    { label: 'Documents Hosted', value: docCount, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100/50' },
    { label: 'Total Downloads', value: totalDownloads, icon: Download, color: 'text-emerald-600', bg: 'bg-emerald-100/50' },
    { label: 'Active Inquiries', value: activeInquiries, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100/50' },
  ];

  return (
    <div className="flex min-h-screen bg-zinc-50/50">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-lg">Quick overview of school activity and files.</p>
            </div>
            <Button 
              variant="outline"
              onClick={exportToCSV}
              className="rounded-full h-12 px-6 border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold"
            >
              <FileDown className="h-5 w-5 mr-2" />
              Download CSV Report
            </Button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground">{stat.label}</p>
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
              <CardHeader className="p-8 border-b border-zinc-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline font-bold text-xl flex items-center gap-3 text-primary">
                    <TrendingUp className="h-6 w-6" />
                    Usage Trends
                  </CardTitle>
                  <CardDescription>Track logins and downloads over time</CardDescription>
                </div>
                <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
                  <TabsList className="bg-zinc-100/50 p-1 rounded-xl h-10">
                    <TabsTrigger value="weekly" className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly" className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Monthly</TabsTrigger>
                    <TabsTrigger value="quarterly" className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm">Quarterly</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="h-[400px] p-8">
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
                    <Line type="monotone" dataKey="logins" stroke="#003366" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Logins" />
                    <Line type="monotone" dataKey="downloads" stroke="#FFD700" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Downloads" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b border-zinc-50">
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3 text-primary">
                  <MousePointer2 className="h-6 w-6" />
                  Documents by Type
                </CardTitle>
                <CardDescription>File distribution by category</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] p-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#888', fontSize: 10}} 
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-zinc-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3 text-primary">
                  <Activity className="h-6 w-6" />
                  Activity History
                </CardTitle>
                <CardDescription>Recent actions from students and staff</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {logsLoading ? (
                  <div className="p-20 flex justify-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {logs?.map((log) => {
                      const userProfile = users?.find(u => u.id === log.userId);
                      return (
                        <div key={log.id} className="px-8 py-5 flex items-center justify-between hover:bg-zinc-50 transition-all group">
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                              log.actionType.includes('UPLOAD') || log.actionType.includes('CREATE') ? "bg-blue-50 text-blue-600" :
                              log.actionType.includes('DOWNLOAD') ? "bg-emerald-50 text-emerald-600" :
                              log.actionType === 'LOGIN' ? "bg-zinc-100 text-zinc-600" :
                              log.actionType.includes('DELETE') ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-600"
                            )}>
                              {log.actionType.includes('UPLOAD') || log.actionType.includes('CREATE') ? <FileText className="h-5 w-5" /> :
                               log.actionType.includes('DOWNLOAD') ? <Download className="h-5 w-5" /> :
                               log.actionType === 'LOGIN' ? <Users className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                                {userProfile?.fullName || 'System User'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 font-medium">
                                {log.details}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 text-right">
                            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                              {format(new Date(log.timestamp), 'hh:mm a')}
                            </span>
                            <span className="text-[10px] text-zinc-300 font-medium">
                              {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
