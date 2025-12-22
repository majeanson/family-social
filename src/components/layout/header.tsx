"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, GitBranch, FileText, Settings, Menu, LayoutDashboard, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
      <div className="container flex h-14 items-center justify-between">
        {/* Logo and Desktop Nav */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">Family Social</span>
          </Link>
          <nav className="hidden items-center ml-8 space-x-6 text-sm font-medium md:flex">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 transition-colors hover:text-foreground/80",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Theme toggle - desktop */}
        <div className="hidden md:flex items-center">
          <ThemeToggle />
        </div>

        {/* Mobile menu */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open navigation menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navigation.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 w-full",
                      pathname === item.href
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "h-4 w-4",
                      pathname === item.href && "text-primary"
                    )} aria-hidden="true" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
