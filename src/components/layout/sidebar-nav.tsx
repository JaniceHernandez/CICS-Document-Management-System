
"use client";

import Link from 'next/link';
import Image from 'next/image';
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
  BarChart3,
  Upload,
  Inbox,
  UserCircle,
  ShieldCheck,
  Loader2,
  GraduationCap
} from 'lucide-react';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { doc } from 'firebase/firestore';

interface SidebarNavProps {
  role: 'admin' | 'student';
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/admin/documents', label: 'Institutional Library', icon: FileText },
  { href: '/admin/submissions', label: 'Student Submissions', icon: Inbox },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/students', label: 'Student Registry', icon: Users },
  { href: '/admin/inquiries', label: 'Support Inquiries', icon: MessageSquare },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
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
  const displayRole = role === 'admin' ? 'Staff' : 'Student';

  return (
    <div className="flex flex-col h-full bg-primary text-white w-64 fixed left-0 top-0 border-r border-white/10 shadow-2xl z-40">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-10 group cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 p-2 group-hover:scale-105 transition-transform">
            {logoImage && (
              <Image 
                src={logoImage.imageUrl} 
                alt="NEU Logo" 
                width={40} 
                height={40} 
                className="object-contain"
              />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-white/50 block">NEU CICS</span>
            <span className="text-xs font-headline font-bold tracking-tight leading-tight uppercase block">
              DMS PORTAL
            </span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-xs uppercase tracking-wider group",
                  isActive 
                    ? "bg-secondary text-primary shadow-lg shadow-secondary/10" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-white/40")} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-sm space-y-2">
          <div className="flex items-center gap-2">
            {isProfileLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-white/40" />
            ) : role === 'admin' ? (
              <ShieldCheck className="h-3 w-3 text-secondary" />
            ) : (
              <GraduationCap className="h-3 w-3 text-secondary" />
            )}
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
              Authenticated {displayRole}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold leading-tight line-clamp-2 text-white">
              {isProfileLoading ? 'Verifying Profile...' : `${displayRole}: ${fullName}`}
            </p>
            {profile?.neuStudentId && (
              <p className="text-[9px] font-medium text-white/30 mt-1 uppercase tracking-tighter">
                ID: {profile.neuStudentId}
              </p>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:text-white hover:bg-destructive/90 transition-all group font-bold text-xs uppercase tracking-wider"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
