"use client";

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Separator } from "@/components/ui/separator";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarNav role="student" />
      <SidebarInset className="bg-zinc-50/50">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Student Portal</span>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}