"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { PortalHeader } from "@/components/layout/portal-header";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav role="student" />
      <SidebarInset className="bg-zinc-50/50">
        <div className="flex h-16 items-center border-b bg-white px-4 md:hidden">
          <SidebarTrigger />
        </div>
        <PortalHeader role="student" />
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}