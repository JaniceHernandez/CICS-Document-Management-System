"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Search, 
  HelpCircle, 
  Bell, 
  LogOut,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface SidebarNavProps {
  role: 'admin' | 'student';
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/documents', label: 'Document Management', icon: FileText },
  { href: '/admin/students', label: 'Student Management', icon: Users },
  { href: '/admin/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
];

const studentLinks = [
  { href: '/student/documents', label: 'All Documents', icon: Search },
  { href: '/student/inquiries', label: 'My Inquiries', icon: MessageSquare },
  { href: '/student/faq', label: 'FAQ & Support', icon: HelpCircle },
  { href: '/student/announcements', label: 'Announcements', icon: Bell },
];

export function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const links = role === 'admin' ? adminLinks : studentLinks;

  return (
    <div className="flex flex-col h-full bg-primary text-white w-64 fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xl font-headline font-bold">CICS Docs</span>
        </div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                  isActive 
                    ? "bg-secondary text-primary shadow-lg" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-xs text-white/50 mb-1">Signed in as</p>
          <p className="text-sm font-medium truncate">
            {role === 'admin' ? 'System Administrator' : 'Student (CICS)'}
          </p>
        </div>
        
        <Link 
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-destructive transition-all"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </Link>
      </div>
    </div>
  );
}