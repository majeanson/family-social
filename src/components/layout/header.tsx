"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, GitBranch, FileText, Settings, LayoutDashboard, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "People", href: "/", icon: Users },
  { name: "Graph", href: "/graph", icon: GitBranch },
  { name: "Events", href: "/events", icon: CalendarDays },
  { name: "Forms", href: "/forms", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to main content
      </a>
      <div className="container flex h-14 items-center justify-between px-2 sm:px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <span className="font-bold text-lg">Famolo</span>
        </Link>

        {/* Navigation - always visible icons */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                aria-label={item.name}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                <span className="hidden lg:inline">{item.name}</span>
              </Link>
            );
          })}
          <div className="ml-1 sm:ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
