"use client";

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
  Line
} from 'recharts';
import { Users, FileText, Download, TrendingUp, AlertCircle, FilePlus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

const downloadData = [
  { name: 'Mon', downloads: 120 },
  { name: 'Tue', downloads: 150 },
  { name: 'Wed', downloads: 80 },
  { name: 'Thu', downloads: 200 },
  { name: 'Fri', downloads: 250 },
  { name: 'Sat', downloads: 60 },
  { name: 'Sun', downloads: 40 },
];

const categoryData = [
  { name: 'Syllabus', count: 45 },
  { name: 'Checklists', count: 32 },
  { name: 'Guidelines', count: 18 },
  { name: 'Forms', count: 56 },
  { name: 'Policies', count: 12 },
];

export default function AdminDashboard() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  // Guard: Only fetch data when we have a user and we know they should be an admin
  const activityLogsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(5));
  }, [firestore, user]);

  const studentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users');
  }, [firestore, user]);

  const documentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'documents');
  }, [firestore, user]);

  const { data: recentLogs, isLoading: logsLoading } = useCollection(activityLogsQuery);
  const { data: allUsers } = useCollection(studentsQuery);
  const { data: allDocs } = useCollection(documentsQuery);

  const studentCount = allUsers?.filter(u => u.role === 'Student').length || 0;
  const docCount = allDocs?.length || 0;
  const totalDownloads = allDocs?.reduce((acc, d) => acc + (d.downloadCount || 0), 0) || 0;

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
              <p className="text-muted-foreground">Monitor your document hub's performance and activity.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full">Export CSV</Button>
              <Button className="bg-primary text-white rounded-full">Weekly Report</Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Students', value: studentCount.toString(), icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Documents Hosted', value: docCount.toString(), icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Total Downloads', value: totalDownloads.toString(), icon: Download, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'System Health', value: '100%', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
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
              <CardHeader className="bg-white">
                <CardTitle className="font-headline font-bold flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                  Weekly Download Activity
                </CardTitle>
                <CardDescription>Number of document downloads over the past 7 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={downloadData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="downloads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-white">
                <CardTitle className="font-headline font-bold flex items-center">
                  <FilePlus className="h-5 w-5 mr-2 text-primary" />
                  Documents by Category
                </CardTitle>
                <CardDescription>Distribution across institutional categories</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 6, fill: 'hsl(var(--secondary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white">
              <CardTitle className="font-headline font-bold">Recent Activity Logs</CardTitle>
              <CardDescription>Latest system-wide events and audit trails</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
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
                          <p className="text-sm font-bold">{log.actionType}</p>
                          <p className="text-sm text-muted-foreground">{log.details}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                  {recentLogs?.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No recent activity found.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}