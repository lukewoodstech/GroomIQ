"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthPage) {
    // Auth pages: no sidebar, full width
    return <>{children}</>;
  }

  // Regular pages: sidebar + content area
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
