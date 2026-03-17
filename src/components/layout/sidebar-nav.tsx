"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Users, 
  Search, 
  HelpCircle, 
  Bell, 
  LogOut,
  MessageSquare,
  BarChart3,
  Upload,
  Inbox,
  ShieldCheck,
  Loader2,
  GraduationCap,
  Settings,
  ChevronUp,
  User2
} from 'lucide-react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarNavProps {
  role: 'admin' | 'student';
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/admin/documents', label: 'Institutional Library', icon: FileText },
  { href: '/admin/submissions', label: 'Student Submissions', icon: Inbox },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/students', label: 'Institutional Registry', icon: Users },
  { href: '/admin/inquiries', label: 'Support Inquiries', icon: MessageSquare },
];

const studentLinks = [
  { href: '/student/documents', label: 'Institutional Library', icon: Search },
  { href: '/student/submit', label: 'My Submissions', icon: Upload },
  { href: '/student/inquiries', label: 'My Inquiries', icon: MessageSquare },
  { href: '/student/faq', label: 'Support & FAQ', icon: HelpCircle },
  { href: '/student/announcements', label: 'Announcements', icon: Bell },
];

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, firestore } = useFirebase();
  const { user } = useUser();
  const logoImage = PlaceHolderImages.find(img => img.id === 'cics-logo');
  const links = role === 'admin' ? adminLinks : studentLinks;

  const userDocRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userDocRef);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const fullName = profile?.fullName || user?.displayName || 'Institutional User';
  const roleLabel = role === 'admin' ? 'Admin' : 'Verified Student';
  const displayPhoto = profile?.photoURL || user?.photoURL;

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10">
      <SidebarHeader className="bg-primary text-white p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5 shrink-0">
            {logoImage && (
              <Image 
                src={logoImage.imageUrl} 
                alt="NEU Logo" 
                width={32} 
                height={32} 
                className="object-contain"
              />
            )}
          </div>
          <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
            <span className="text-[9px] font-bold tracking-[0.2em] text-white/50 block uppercase">NEU CICS</span>
            <span className="text-xs font-headline font-bold tracking-tight leading-tight uppercase block">
              DMS Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-primary text-white pt-6">
        <SidebarMenu className="px-2 gap-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                  tooltip={link.label}
                  className={cn(
                    "rounded-xl transition-all font-bold text-xs uppercase tracking-wider h-11",
                    isActive 
                      ? "bg-secondary text-primary shadow-lg" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                >
                  <Link href={link.href}>
                    <link.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-white/40")} />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-primary text-white p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton 
                  size="lg" 
                  className="rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                >
                  <Avatar className="h-8 w-8 border-2 border-white/10">
                    <AvatarImage src={displayPhoto || undefined} alt={fullName} />
                    <AvatarFallback className="bg-secondary text-primary font-bold text-xs">
                      {fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-bold leading-none truncate mb-1">
                      {isProfileLoading ? 'Identifying...' : fullName}
                    </span>
                    <div className="flex items-center gap-1 opacity-50">
                      {role === 'admin' ? (
                        <ShieldCheck className="h-2.5 w-2.5 text-secondary" />
                      ) : (
                        <GraduationCap className="h-2.5 w-2.5 text-secondary" />
                      )}
                      <span className="text-[8px] font-bold uppercase tracking-widest">{roleLabel}</span>
                    </div>
                  </div>
                  <ChevronUp className="h-4 w-4 opacity-50 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56 rounded-2xl p-2 border-none shadow-2xl">
                {role === 'admin' && (
                  <>
                    <DropdownMenuItem 
                      asChild 
                      className="rounded-xl cursor-pointer py-3 focus:bg-primary/5 focus:text-primary font-bold text-xs uppercase tracking-wider"
                    >
                      <Link href="/admin/settings">
                        <Settings className="h-4 w-4 mr-3" />
                        System Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-2 bg-zinc-50" />
                  </>
                )}
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="rounded-xl cursor-pointer py-3 focus:bg-destructive focus:text-white font-bold text-xs uppercase tracking-wider text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}