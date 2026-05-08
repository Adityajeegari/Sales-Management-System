import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  Receipt,
  PieChart,
  Settings as SettingsIcon,
  Menu,
  LogOut,
  Sparkles,
  ShieldCheck,
  Package,
  Activity as ActivityIcon,
} from "lucide-react";
import { NotificationsBell } from "@/components/notifications-bell";
import { useClerk, useUser } from "@/lib/salesos";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, useCurrentUserRole } from "@/lib/roles";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Sales", href: "/sales", icon: Receipt },
  { title: "Products", href: "/products", icon: Package },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "Reports", href: "/reports", icon: PieChart },
  { title: "Activity", href: "/activity", icon: ActivityIcon },
  { title: "Team", href: "/team", icon: ShieldCheck },
  { title: "Settings", href: "/settings", icon: SettingsIcon },
];

function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="h-4 w-4" />
      </span>
      <span className="text-base tracking-tight">Sales OS</span>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { role, isAdmin } = useCurrentUserRole();

  const visibleNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="grid gap-0.5 px-3">
      {visibleNav.map((item) => {
        const Icon = item.icon;
        const isActive =
          location === item.href || location.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );

  const initials =
    (user?.firstName?.charAt(0) ?? "") +
      (user?.lastName?.charAt(0) ?? "") || "U";
  const displayName = user?.fullName || user?.firstName || "Account";
  const displayEmail = user?.primaryEmailAddress?.emailAddress || "No email";
  const displayRole = role ? ROLE_LABELS[role] : "Admin";

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] bg-muted/30">
      <aside className="hidden border-r bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-5">
          <Link href="/dashboard">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <NavLinks />
        </div>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-lg px-1 py-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
              <AvatarFallback className="bg-orange-500 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 max-w-[108px] flex-1 pr-1">
              <p className="truncate text-sm font-semibold leading-5">
                {displayName}
              </p>
              <p className="truncate text-xs text-muted-foreground leading-5">
                {displayEmail}
              </p>
            </div>
            <Badge
              variant="outline"
              className="h-7 min-w-[74px] shrink-0 rounded-md px-3 text-xs font-semibold capitalize"
            >
              {displayRole}
            </Badge>
          </div>
        </div>
      </aside>

      <div className="flex flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[260px] flex-col gap-4 p-0 pt-6"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Use this menu to navigate between dashboard pages.
              </SheetDescription>
              <div className="px-5 pb-2">
                <Logo />
              </div>
              <NavLinks />
            </SheetContent>
          </Sheet>

          <div className="flex-1" />
          <NotificationsBell />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.fullName || ""}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span>{displayName}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {displayEmail}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex w-full">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
