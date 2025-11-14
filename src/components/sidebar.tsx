"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PawPrint,
  Calendar,
  Settings,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Pets", href: "/pets", icon: PawPrint },
  { name: "Schedule", href: "/schedule", icon: Calendar },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-16 flex-col border-r bg-muted/40">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
          G
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors">
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={item.name}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

