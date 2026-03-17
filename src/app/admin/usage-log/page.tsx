
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  History, 
  Search, 
  Filter, 
  Loader2, 
  Download, 
  Upload, 
  Edit, 
  LogIn, 
  Users, 
  ShieldCheck,
  MoreVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function UsageLogPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'activityLogs'), orderBy('timestamp', 'desc'), limit(1000));
  }, [firestore, user]);

  const usersQuery = useMemoFirebase(() => (firestore && user) ? collection(firestore, 'users') : null, [firestore, user]);

  const { data: logs, isLoading: logsLoading } = useCollection(logsQuery);
  const { data: users } = useCollection(usersQuery);

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'LOGIN': return <LogIn className="h-4 w-4" />;
      case 'DOCUMENT_DOWNLOAD': return <Download className="h-4 w-4" />;
      case 'DOCUMENT_UPLOAD': return <Upload className="h-4 w-4" />;
      case 'DOCUMENT_EDIT': return <Edit className="h-4 w-4" />;
      case 'DOCUMENT_DELETE': return <Edit className="h-4 w-4" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const filteredLogs = logs?.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          users?.find(u => u.id === log.userId)?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'ALL') return matchesSearch;
    if (filter === 'MODIFICATIONS') return matchesSearch && (log.actionType === 'DOCUMENT_EDIT' || log.actionType === 'DOCUMENT_DELETE');
    return matchesSearch && log.actionType === filter;
  });

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Institutional Usage Log</h1>
            <p className="text-muted-foreground mt-1 text-lg">Comprehensive audit trail of institutional system interactions.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search logs or users..." 
                className="pl-9 h-11 rounded-xl bg-white border-zinc-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl bg-white border-zinc-200">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Activities" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="ALL">All Activities</SelectItem>
                <SelectItem value="LOGIN">User Logins</SelectItem>
                <SelectItem value="DOCUMENT_DOWNLOAD">File Downloads</SelectItem>
                <SelectItem value="DOCUMENT_UPLOAD">File Uploads</SelectItem>
                <SelectItem value="MODIFICATIONS">Modifications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="p-8 border-b border-zinc-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline font-bold text-xl flex items-center gap-3">
                  <History className="h-6 w-6 text-primary" />
                  Audit Ledger
                </CardTitle>
                <CardDescription>Displaying {filteredLogs?.length || 0} activity records</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="py-32 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="mt-4 text-muted-foreground font-bold text-xs uppercase tracking-widest">Scanning Log Registry...</p>
              </div>
            ) : filteredLogs?.length === 0 ? (
              <div className="py-32 text-center text-muted-foreground font-medium">
                No activity records found matching your current filters.
              </div>
            ) : (
              <div className="divide-y divide-zinc-50">
                {filteredLogs?.map((log) => {
                  const userProfile = users?.find(u => u.id === log.userId);
                  return (
                    <div key={log.id} className="px-8 py-6 flex items-center justify-between hover:bg-zinc-50 transition-all group">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-12 w-12 rounded-2xl border-none bg-primary/5">
                            <AvatarFallback className="text-primary font-bold text-sm">
                              {userProfile?.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 p-1 rounded-lg text-white shadow-lg",
                            log.actionType === 'LOGIN' ? "bg-blue-500" :
                            log.actionType === 'DOCUMENT_DOWNLOAD' ? "bg-green-500" :
                            log.actionType === 'DOCUMENT_UPLOAD' ? "bg-purple-500" :
                            "bg-amber-500"
                          )}>
                            {getActionIcon(log.actionType)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-zinc-900 group-hover:text-primary transition-colors">
                              {userProfile?.fullName || 'System User'}
                            </p>
                            <Badge variant="outline" className={cn(
                              "border-none text-[9px] font-bold uppercase tracking-widest px-2 py-0.5",
                              userProfile?.role === 'Admin' ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600"
                            )}>
                              {userProfile?.role || 'Guest'}
                            </Badge>
                          </div>
                          <p className="text-sm text-zinc-600 mt-1 font-medium leading-relaxed">
                            {log.details}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 text-right">
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                          {format(new Date(log.timestamp), 'hh:mm:ss a')}
                        </span>
                        <span className="text-[10px] text-zinc-300 font-bold uppercase">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
