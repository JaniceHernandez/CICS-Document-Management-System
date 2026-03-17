"use client";

import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LogOut, 
  Settings, 
  ShieldCheck, 
  GraduationCap, 
  User as UserIcon,
  ChevronDown
} from 'lucide-react';
import { doc } from 'firebase/firestore';
import Link from 'next/link';

interface PortalHeaderProps {
  role: 'admin' | 'student';
}

export function PortalHeader({ role }: PortalHeaderProps) {
  const { auth, firestore } = useFirebase();
  const { user } = useUser();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc(userDocRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (e) {
      console.error(e);
    }
  };

  const fullName = profile?.fullName || user?.displayName || 'Institutional User';
  const displayPhoto = profile?.photoURL || user?.photoURL;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-white px-6 shadow-sm sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hidden md:block">
          {role === 'admin' ? 'Administrative Control Center' : 'CICS Student Portal'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-12 rounded-2xl px-2 hover:bg-zinc-50 flex items-center gap-3 transition-all border border-transparent hover:border-zinc-100">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-zinc-900 leading-none">{fullName}</span>
                <Badge variant="secondary" className="mt-1 h-4 text-[8px] font-bold uppercase tracking-widest border-none bg-primary/5 text-primary">
                  {role === 'admin' ? <ShieldCheck className="h-2 w-2 mr-1" /> : <GraduationCap className="h-2 w-2 mr-1" />}
                  {role}
                </Badge>
              </div>
              <Avatar className="h-9 w-9 border-2 border-white shadow-md">
                <AvatarImage src={displayPhoto || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary text-white font-bold text-xs uppercase">
                  {fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-zinc-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-3xl p-3 border-none shadow-2xl mt-2">
            <DropdownMenuLabel className="px-4 py-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Account Session</p>
              <p className="text-sm font-bold text-zinc-900 mt-1 truncate">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-2 bg-zinc-50" />
            {role === 'admin' && (
              <DropdownMenuItem asChild className="rounded-2xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary">
                <Link href="/admin/settings" className="flex items-center w-full font-bold">
                  <Settings className="h-4 w-4 mr-3" /> System Settings
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="rounded-2xl cursor-pointer py-3 text-destructive focus:bg-destructive focus:text-white font-bold"
            >
              <LogOut className="h-4 w-4 mr-3" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
