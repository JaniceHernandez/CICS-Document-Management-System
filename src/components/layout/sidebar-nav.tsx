"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Users, 
  Settings, 
  Search, 
  HelpCircle, 
  Bell, 
  LogOut,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  Upload
} from 'lucide-react';
import { useFirebase, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

interface SidebarNavProps {
  role: 'admin' | 'student';
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/documents', label: 'Documents', icon: FileText },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const studentLinks = [
  { href: '/student/documents', label: 'Library', icon: Search },
  { href: '/student/submit', label: 'My Submissions', icon: Upload },
  { href: '/student/inquiries', label: 'My Inquiries', icon: MessageSquare },
  { href: '/student/faq', label: 'Support', icon: HelpCircle },
  { href: '/student/announcements', label: 'Announcements', icon: Bell },
];

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth } = useFirebase();
  const { user } = useUser();
  const links = role === 'admin' ? adminLinks : studentLinks;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-primary text-white w-64 fixed left-0 top-0 border-r border-white/10 shadow-2xl z-40">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center shadow-lg shadow-secondary/20">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-headline font-bold tracking-tight">CICS Hub</span>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group",
                  isActive 
                    ? "bg-secondary text-primary shadow-lg shadow-secondary/10" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-white/40")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-1">Signed In</p>
          <p className="text-sm font-bold truncate">
            {role === 'admin' ? 'Administrator' : user?.email?.split('@')[0] || 'Student'}
          </p>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-destructive transition-all group"
        >
          <LogOut className="h-5 w-5 text-white/40 group-hover:text-white" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
