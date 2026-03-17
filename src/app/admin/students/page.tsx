"use client";

import { useState, useEffect } from 'react';
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
  GraduationCap,
  ShieldAlert,
  Trash2
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const SUPER_ADMIN_EMAIL = 'admin@neu.edu.ph';

export default function InstitutionalRegistry() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const usersQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'users') : null, [firestore, currentUser]);
  const programsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'programs') : null, [firestore, currentUser]);
  const authorizedAdminsQuery = useMemoFirebase(() => (firestore && currentUser) ? collection(firestore, 'authorizedAdmins') : null, [firestore, currentUser]);
  
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: programs } = useCollection(programsQuery);
  const { data: authorizedAdmins } = useCollection(authorizedAdminsQuery);

  const isSuperAdmin = currentUser?.email === SUPER_ADMIN_EMAIL;

  // Combine active users and pending administrative clearances
  const combinedMembers = [...(users || [])];
  
  authorizedAdmins?.forEach(auth => {
    const emailLower = auth.email?.toLowerCase();
    const alreadyInUsers = users?.find(u => u.email?.toLowerCase() === emailLower);
    if (!alreadyInUsers) {
      combinedMembers.push({
        id: auth.id,
        email: auth.email,
        fullName: 'Authorized Administrator',
        role: 'Admin',
        status: 'pending',
        isPendingAuth: true,
        authorizedAt: auth.authorizedAt
      });
    }
  });

  const filteredUsers = combinedMembers.filter(u => {
    const matchesSearch = (u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (roleFilter === 'all') return matchesSearch;
    return matchesSearch && u.role === roleFilter;
  }).sort((a, b) => {
    if (a.email === SUPER_ADMIN_EMAIL) return -1;
    if (b.email === SUPER_ADMIN_EMAIL) return 1;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  const toggleUserStatus = (userData: any) => {
    if (!firestore || !currentUser) return;
    
    // Safety: Cannot block the super admin
    if (userData.email === SUPER_ADMIN_EMAIL) {
      toast({ title: "Action Denied", description: "The Super Admin account cannot be restricted.", variant: "destructive" });
      return;
    }

    // Regular admins cannot block other admins
    if (!isSuperAdmin && userData.role === 'Admin') {
      toast({ title: "Permission Denied", description: "Only the Super Admin can restrict staff access.", variant: "destructive" });
      return;
    }

    const newStatus = userData.status === 'active' ? 'blocked' : 'active';
    const action = newStatus === 'blocked' ? 'USER_BLOCKED' : 'USER_UNBLOCKED';
    
    updateDocumentNonBlocking(doc(firestore, 'users', userData.id), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    logActivity(
      firestore, 
      currentUser.uid, 
      action as any, 
      `${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'} account: ${userData.fullName} (${userData.email})`, 
      undefined, 
      userData.id
    );
    toast({ title: `User ${newStatus === 'active' ? 'Unblocked' : 'Blocked'}` });
  };

  const handleAuthorizeAdmin = async () => {
    if (!firestore || !adminEmail.trim() || !isSuperAdmin) return;
    setIsSubmittingAdmin(true);
    try {
      const emailId = adminEmail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(firestore, 'authorizedAdmins', emailId), {
        id: emailId,
        email: adminEmail.toLowerCase().trim(),
        authorizedBy: currentUser?.uid,
        authorizedAt: new Date().toISOString()
      });

      logActivity(firestore, currentUser!.uid, 'USER_UNBLOCKED' as any, `Super Admin authorized email: ${adminEmail}`);
      toast({ title: "Admin Authorized", description: `${adminEmail} can now access the admin portal.` });
      setAdminEmail('');
      setIsAdminDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleRevokeClearance = async (userData: any) => {
    if (!firestore || !isSuperAdmin) return;
    if (userData.email === SUPER_ADMIN_EMAIL) {
      toast({ title: "Action Denied", description: "Super Admin clearance cannot be revoked.", variant: "destructive" });
      return;
    }

    if (confirm(`Revoke administrative clearance for ${userData.email}?`)) {
      try {
        const emailId = userData.email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
        await deleteDoc(doc(firestore, 'authorizedAdmins', emailId));
        
        // If the user has an active profile, downgrade them or block them
        if (!userData.isPendingAuth) {
          updateDocumentNonBlocking(doc(firestore, 'users', userData.id), {
            role: 'Student', // Or just block them
            status: 'blocked',
            updatedAt: new Date().toISOString()
          });
          await deleteDoc(doc(firestore, 'adminRoles', userData.id));
        }

        logActivity(firestore, currentUser!.uid, 'USER_BLOCKED' as any, `Revoked admin clearance: ${userData.email}`);
        toast({ title: "Clearance Revoked" });
      } catch (e: any) {
        toast({ variant: "destructive", title: "Revocation Failed", description: e.message });
      }
    }
  };

  const getProgramCode = (programIds: string[]) => {
    if (!programIds || programIds.length === 0) return 'N/A';
    return programs?.find(p => p.id === programIds[0])?.shortCode || 'N/A';
  };

  if (!mounted) {
    return (
      <main className="p-8">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary tracking-tight">Institutional Registry</h1>
            <p className="text-muted-foreground">Manage students and administrative staff access.</p>
          </div>
          {isSuperAdmin && (
            <Button 
              onClick={() => setIsAdminDialogOpen(true)}
              className="bg-secondary text-primary hover:bg-secondary/90 rounded-xl h-11 px-6 font-bold shadow-lg shadow-secondary/10 transition-all hover:scale-105"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Authorize New Admin
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registered Users</p>
                <p className="text-2xl font-bold text-primary">{users?.length || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-sm rounded-2xl bg-white p-6 transition-all hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staff & Admins</p>
                <p className="text-2xl font-bold text-primary">
                  {combinedMembers.filter(u => u.role === 'Admin').length || 0}
                </p>
              </div>
            </div>
          </Card>
          <Card className="border-none shadow-sm rounded-2xl bg-white p-6 transition-all hover:shadow-md">
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
                  className="pl-9 h-11 rounded-xl focus-visible:ring-primary shadow-sm"
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
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-bold uppercase py-1 border-primary/20 text-primary">
                Super Admin: {SUPER_ADMIN_EMAIL}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">Scanning Registry...</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-zinc-50/50">
                  <TableRow className="border-none">
                    <TableHead className="font-bold px-6">Member Name</TableHead>
                    <TableHead className="font-bold">Role</TableHead>
                    <TableHead className="font-bold">Email</TableHead>
                    <TableHead className="font-bold">Affiliation</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((member) => {
                    const isSuper = member.email === SUPER_ADMIN_EMAIL;
                    const canModify = isSuperAdmin && !isSuper;
                    const isStudent = member.role === 'Student';
                    const canBlock = isSuperAdmin ? !isSuper : isStudent;

                    return (
                      <TableRow key={member.id} className="hover:bg-zinc-50/50 transition-colors border-zinc-50 group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 bg-primary/10 border-none transition-transform group-hover:scale-110">
                              {member.photoURL && <AvatarImage src={member.photoURL} />}
                              <AvatarFallback className="text-primary font-bold">
                                {member.fullName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                {member.fullName}
                                {isSuper && <ShieldAlert className="h-3 w-3 text-secondary fill-secondary" title="Super Admin" />}
                              </span>
                              {member.isPendingAuth && (
                                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter">Auth Pending</span>
                              )}
                            </div>
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
                          <span className="text-sm text-muted-foreground font-medium">{member.email}</span>
                        </TableCell>
                        <TableCell>
                          {isStudent ? (
                            <Badge variant="outline" className="border-primary/20 text-primary font-bold px-2 py-0.5">
                              {getProgramCode(member.programIds)}
                            </Badge>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">CICS Staff</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "border-none font-bold px-3 py-1 uppercase text-[9px] tracking-widest shadow-sm",
                              member.status === 'active' 
                                ? "bg-green-100 text-green-700" 
                                : member.status === 'pending'
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700"
                            )}
                          >
                            {member.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          {(canBlock || (isSuperAdmin && !isSuper)) ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-xl hover:bg-zinc-100 transition-colors">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-none p-2 animate-in fade-in-0 zoom-in-95">
                                {!member.isPendingAuth && canBlock && (
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
                                )}
                                {member.role === 'Admin' && isSuperAdmin && !isSuper && (
                                  <DropdownMenuItem 
                                    className="cursor-pointer font-bold rounded-lg py-2 text-destructive"
                                    onClick={() => handleRevokeClearance(member)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete Account/Email
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest px-2">Protected</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
                  className="pl-11 h-12 rounded-xl border-zinc-200 focus-visible:ring-primary shadow-sm"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed font-medium">
                Authorized users will automatically receive administrative access upon their first login using this email.
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
              {isSubmittingAdmin ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm Clearance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}