"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  AlertCircle,
  ShieldCheck
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
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('weekly');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?role=admin');
    }
  }, [user, isUserLoading, router]);

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
  
  const docCount = allDocs?.filter(d => 
    d.type === 'institutional' || 
    d.fileUrl?.includes('cics-docs')
  ).length || 0;

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

  const categoryStats = allCategories?.map(cat => {
    const docsInCategory = allDocs?.filter(d => d.categoryId === cat.id) || [];
    const downloadsInCategory = docsInCategory.reduce((acc, d) => acc + (d.downloadCount || 0), 0);
    return {
      name: cat.name,
      downloads: downloadsInCategory
    };
  }).filter(c => c.name).sort((a, b) => b.downloads - a.downloads) || [];

  const exportToCSV = () => {
    if (!logs) return;
    
    const summary = [
      ['Institutional Overview Summary'],
      [''],
      ['Registered Students', studentCount],
      ['Documents Hosted', docCount],
      ['Total Downloads', totalDownloads],
      ['Active Inquiries', activeInquiries],
      ['Report Generated On', new Date().toLocaleString()],
      [''],
      ['Activity History']
    ];

    const headers = ['Action Description', 'User Name', 'Action Type', 'Timestamp'];
    const rows = logs.map(log => {
      const userName = users?.find(u => u.id === log.userId)?.fullName || 'System User';
      return [
        log.details,
        userName,
        log.actionType,
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
    link.setAttribute('download', `institutional_dashboard_report_${format(new Date(), 'yyyyMMdd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isUserLoading || (!user && !isUserLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center p-20">
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
    <main className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">System Overview</h1>
            <p className="text-muted-foreground mt-1 text-lg">General activity and engagement monitoring.</p>
          </div>
          <Button 
            variant="outline"
            onClick={exportToCSV}
            className="rounded-full h-12 px-6 border-zinc-200 hover:bg-zinc-100 text-zinc-600 font-bold"
          >
            <FileDown className="h-5 w-5 mr-2" />
            Export Overview
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
                  Activity Trends
                </CardTitle>
                <CardDescription>Daily logins and document downloads over time.</CardDescription>
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
                Downloads By Classification
              </CardTitle>
              <CardDescription>Total downloads aggregated by document category.</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] p-8">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryStats} margin={{ bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#888', fontSize: 9}} 
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="downloads" radius={[10, 10, 0, 0]}>
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
                Recent Activity
              </CardTitle>
              <CardDescription>Latest interactions within the institutional system.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              {logsLoading ? (
                <div className="p-20 flex justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="divide-y divide-zinc-50">
                  {logs?.slice(0, 50).map((log) => {
                    const userProfile = users?.find(u => u.id === log.userId);
                    return (
                      <div key={log.id} className="px-8 py-5 flex items-center justify-between hover:bg-zinc-50 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className={cn(
                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                            userProfile?.role === 'Admin' ? "bg-primary text-white" : "bg-secondary text-primary"
                          )}>
                            {userProfile?.role === 'Admin' ? <ShieldCheck className="h-5 w-5" /> : <Users className="h-5 w-5" />}
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
                            {format(new Date(log.timestamp), 'MMM dd')}
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
  );
}
