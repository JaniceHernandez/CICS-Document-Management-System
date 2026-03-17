"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Search, 
  MoreVertical, 
  UserX, 
  UserCheck, 
  UserPlus,
  Loader2,
  Users,
  ShieldCheck,
  Mail,
  GraduationCap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export default function InstitutionalRegistry() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);
  const programsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'programs') : null, [firestore, adminUser]);
  const authorizedAdminsQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'authorizedAdmins') : null, [firestore, adminUser]);
  
  const { data: users, isLoading } = useCollection(usersQuery);
  const { data: programs } = useCollection(programsQuery);
  const { data: authorizedAdmins } = useCollection(authorizedAdminsQuery);

  const filteredUsers = users?.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const toggleUserStatus = (userData: any) => {
    if (!firestore || !adminUser) return;
    const newStatus = userData.status === 'active' ? 'blocked' : 'active';
    const action = newStatus === 'blocked' ? 'USER_BLOCKED' : 'USER_UNBLOCKED';
    
    updateDocumentNonBlocking(doc(firestore, 'users', userData.id), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    logActivity(
      firestore, 
      adminUser.uid, 
      action as any, 
      `${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'} account: ${userData.fullName}`, 
      undefined, 
      userData.id
    );
    toast({ title: `User ${newStatus === 'active' ? 'Unblocked' : 'Blocked'}` });
  };

  const handleAuthorizeAdmin = async () => {
    if (!firestore || !adminEmail.trim()) return;
    setIsSubmittingAdmin(true);
    try {
      const emailId = adminEmail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(firestore, 'authorizedAdmins', emailId), {
        email: adminEmail.toLowerCase().trim(),
        authorizedBy: adminUser?.uid,
        authorizedAt: new Date().toISOString()
      });

      logActivity(firestore, adminUser!.uid, 'USER_UNBLOCKED' as any, `Authorized admin email: ${adminEmail}`);
      toast({ title: "Admin Authorized", description: `${adminEmail} can now access the admin portal.` });
      setAdminEmail('');
      setIsAdminDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const getProgramCode = (programIds: string[]) => {
    if (!programIds || programIds.length === 0) return 'N/A';
    return programs?.find(p => p.id === programIds[0])?.shortCode || 'N/A';
  };

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary">Institutional Registry</h1>
            <p className="text-muted-foreground">Manage students and administrative staff access.</p>
          </div>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={() => setIsAdminDialogOpen(true)}
              className="bg-secondary text-primary hover:bg-secondary/90 rounded-xl h-11 px-6 font-bold shadow-lg shadow-secondary/10"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Register Admin
            </Button>
          </div>
        </header>

        <Tabs defaultValue="directory" className="space-y-6">
          <TabsList className="bg-zinc-100/50 p-1 rounded-xl h-12">
            <TabsTrigger value="directory" className="rounded-lg text-xs font-bold px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              User Directory
            </TabsTrigger>
            <TabsTrigger value="clearances" className="rounded-lg text-xs font-bold px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Administrative Clearances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="directory" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-primary">{users?.length || 0}</p>
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <ShieldCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Staff & Admins</p>
                    <p className="text-2xl font-bold text-primary">
                      {users?.filter(u => u.role === 'Admin').length || 0}
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                    <p className="text-2xl font-bold text-primary">
                      {users?.filter(u => u.role === 'Student' && u.status === 'active').length || 0}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-white border-b p-6 flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name or email..." 
                      className="pl-9 h-11 rounded-xl"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40 h-11 rounded-xl bg-white border-zinc-200">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Admin">Administrators</SelectItem>
                      <SelectItem value="Student">Students</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                    <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Scanning Directory...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-zinc-50">
                      <TableRow>
                        <TableHead className="font-bold">Member Name</TableHead>
                        <TableHead className="font-bold">Role</TableHead>
                        <TableHead className="font-bold">Email</TableHead>
                        <TableHead className="font-bold">Program</TableHead>
                        <TableHead className="font-bold">Status</TableHead>
                        <TableHead className="font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((member) => (
                        <TableRow key={member.id} className="hover:bg-zinc-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 bg-primary/10 border-none">
                                <AvatarFallback className="text-primary font-bold">
                                  {member.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-bold">{member.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "border-none font-bold px-2 py-0.5 uppercase text-[10px] tracking-widest",
                              member.role === 'Admin' ? "bg-primary text-white" : "bg-zinc-100 text-zinc-600"
                            )}>
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{member.email}</span>
                          </TableCell>
                          <TableCell>
                            {member.role === 'Student' ? (
                              <Badge variant="outline" className="border-primary/20 text-primary font-bold px-2 py-0.5">
                                {getProgramCode(member.programIds)}
                              </Badge>
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground uppercase">Institutional staff</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "border-none font-bold px-3 py-1 uppercase text-[9px] tracking-widest",
                                member.status === 'active' 
                                  ? "bg-green-100 text-green-700" 
                                  : "bg-red-100 text-red-700"
                              )}
                            >
                              {member.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-none p-2">
                                <DropdownMenuItem 
                                  className={cn(
                                    "cursor-pointer font-bold rounded-lg py-2",
                                    member.status === 'active' ? "text-destructive" : "text-green-600"
                                  )}
                                  onClick={() => toggleUserStatus(member)}
                                >
                                  {member.status === 'active' ? (
                                    <><UserX className="h-4 w-4 mr-2" /> Block Access</>
                                  ) : (
                                    <><UserCheck className="h-4 w-4 mr-2" /> Restore Access</>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clearances">
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
              <CardHeader className="p-8 border-b">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  Administrator Clearances
                </CardTitle>
                <CardDescription>Emails listed here will automatically be granted administrative access upon login.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="px-8 font-bold">Authorized Email</TableHead>
                      <TableHead className="font-bold text-center">Authorized At</TableHead>
                      <TableHead className="px-8 text-right font-bold">Manage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {authorizedAdmins?.map((auth) => (
                      <TableRow key={auth.id}>
                        <TableCell className="px-8 font-bold text-zinc-700">{auth.email}</TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {auth.authorizedAt ? new Date(auth.authorizedAt).toLocaleString() : 'N/A'}
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:bg-destructive/5 font-bold"
                            onClick={async () => {
                              if(confirm('Revoke access for this email?')) {
                                updateDocumentNonBlocking(doc(firestore, 'authorizedAdmins', auth.id), { status: 'revoked' } as any);
                                // For simplicity in this demo, we'll actually delete the clearance
                                const { deleteDoc, doc } = await import('firebase/firestore');
                                await deleteDoc(doc(firestore, 'authorizedAdmins', auth.id));
                                toast({ title: "Clearance Revoked" });
                              }
                            }}
                          >
                            Revoke
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-none p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-white">
            <div className="p-3 bg-white/10 w-fit rounded-2xl mb-4">
              <ShieldCheck className="h-6 w-6 text-secondary" />
            </div>
            <DialogTitle className="text-2xl font-bold font-headline uppercase">Authorize Admin</DialogTitle>
            <DialogDescription className="text-white/70">
              Grant institutional management clearance to a specific email address.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Administrator Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input 
                  placeholder="e.g. staff@neu.edu.ph"
                  className="pl-11 h-12 rounded-xl border-zinc-200"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed font-medium">
                Once authorized, the user can log in via Google or Email to access all administrative features and student filings.
              </p>
            </div>
          </div>
          <DialogFooter className="p-8 bg-zinc-50 border-t flex items-center justify-between">
            <Button variant="ghost" onClick={() => setIsAdminDialogOpen(false)} className="rounded-xl h-11 px-6 text-zinc-500 font-bold">Cancel</Button>
            <Button 
              onClick={handleAuthorizeAdmin} 
              disabled={!adminEmail || isSubmittingAdmin}
              className="bg-primary text-white rounded-xl h-11 px-10 font-bold shadow-lg shadow-primary/20"
            >
              {isSubmittingAdmin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
