"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Users, 
  Search, 
  HelpCircle, 
  Bell, 
  MessageSquare,
  BarChart3,
  Upload,
  Inbox,
  History
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface SidebarNavProps {
  role: 'admin' | 'student';
}

const adminLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: BarChart3 },
  { href: '/admin/documents', label: 'Institutional Library', icon: FileText },
  { href: '/admin/submissions', label: 'Student Submissions', icon: Inbox },
  { href: '/admin/usage-log', label: 'Usage Log', icon: History },
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
  const logoImage = PlaceHolderImages.find(img => img.id === 'cics-logo');
  const links = role === 'admin' ? adminLinks : studentLinks;

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
    </Sidebar>
  );
}
