"use client";

import { useState } from 'react';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Search, 
  MoreVertical, 
  UserX, 
  UserCheck, 
  Mail,
  GraduationCap,
  Filter,
  Loader2
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
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { logActivity } from '@/lib/activity-logging';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function StudentManagement() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');

  const usersQuery = useMemoFirebase(() => (firestore && adminUser) ? collection(firestore, 'users') : null, [firestore, adminUser]);
  const { data: users, isLoading } = useCollection(usersQuery);

  const students = users?.filter(u => u.role === 'Student') || [];
  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserStatus = (student: any) => {
    if (!firestore || !adminUser) return;
    const newStatus = student.status === 'active' ? 'blocked' : 'active';
    updateDocumentNonBlocking(doc(firestore, 'users', student.id), {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    logActivity(
      firestore, 
      adminUser.uid, 
      'USER_BLOCKED', 
      `${newStatus === 'blocked' ? 'Blocked' : 'Unblocked'} student: ${student.fullName}`, 
      undefined, 
      student.id
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarNav role="admin" />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-headline font-bold text-primary">Student Management</h1>
              <p className="text-muted-foreground">Monitor and manage access for CICS students.</p>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" className="rounded-full">
                <Filter className="h-4 w-4 mr-2" />
                Filter Domain
              </Button>
              <Button className="bg-primary text-white rounded-full">
                Invite Students
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <GraduationCap className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold text-primary">{students.length}</p>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-primary">
                    {students.filter(s => s.status === 'active').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <UserX className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blocked</p>
                  <p className="text-2xl font-bold text-primary">
                    {students.filter(s => s.status === 'blocked').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="border-none shadow-sm rounded-2xl bg-zinc-900 text-white p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800 rounded-xl">
                  <Mail className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-400">Institutional</p>
                  <p className="text-2xl font-bold text-white">100%</p>
                </div>
              </div>
            </Card>
          </div>

          <Card className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-white border-b p-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-headline font-bold text-xl">Student Directory</CardTitle>
                <CardDescription>Managing institutional portal access</CardDescription>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name or email..." 
                  className="pl-9 h-11 rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
                  <p className="text-muted-foreground">Fetching student records...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow>
                      <TableHead className="font-bold">Student Name</TableHead>
                      <TableHead className="font-bold">Email Address</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="font-bold">Last Login</TableHead>
                      <TableHead className="font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id} className="hover:bg-zinc-50/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 bg-primary/10 border-none">
                              <AvatarFallback className="text-primary font-bold">
                                {student.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{student.fullName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{student.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "border-none font-bold px-3 py-1",
                              student.status === 'active' 
                                ? "bg-green-100 text-green-700" 
                                : "bg-red-100 text-red-700"
                            )}
                          >
                            {student.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {student.lastLoginAt ? new Date(student.lastLoginAt).toLocaleString() : 'Never'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-none">
                              <DropdownMenuItem 
                                className={cn(
                                  "cursor-pointer font-medium",
                                  student.status === 'active' ? "text-destructive" : "text-green-600"
                                )}
                                onClick={() => toggleUserStatus(student)}
                              >
                                {student.status === 'active' ? (
                                  <><UserX className="h-4 w-4 mr-2" /> Block Account</>
                                ) : (
                                  <><UserCheck className="h-4 w-4 mr-2" /> Unblock Account</>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredStudents.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                          No students found matching your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
