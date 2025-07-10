"use client";

import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  GitFork,
  Package,
  Warehouse,
  Users,
  Truck,
  Handshake,
  Boxes,
  BookUser,
  Sparkles,
  AreaChart,
  UserCog,
  Settings,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { cn } from "@/lib/utils";

const Logo = () => (
    <div className="flex items-center gap-2" >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
        <h1 className="text-lg font-bold font-headline text-primary-foreground">MultiBranch</h1>
    </div>
);


const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link href={href}>
          {icon}
          <span>{children}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const NavCollapsible = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => {
    const pathname = usePathname();
    const childPaths = React.Children.map(children, child => {
        if (React.isValidElement(child) && child.props.href) {
            return child.props.href;
        }
        return null;
    }) || [];
    const isOpen = childPaths.some(path => pathname.startsWith(path));

    return (
        <Collapsible defaultOpen={isOpen}>
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                        {icon}
                        <span>{title}</span>
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent asChild>
                <SidebarMenuSub>{children}</SidebarMenuSub>
            </CollapsibleContent>
        </Collapsible>
    );
};

const NavSubLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild isActive={isActive}>
                <Link href={href}>{children}</Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    );
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="bg-sidebar-primary">
            <div className="flex w-full items-center justify-between p-2">
                <Logo />
            </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <NavLink href="/" icon={<LayoutDashboard />}>Dashboard</NavLink>
            <NavLink href="/branches" icon={<GitFork />}>Branches</NavLink>
            
            <NavCollapsible title="Master Data" icon={<Package />}>
                <NavSubLink href="/master-data/items">Items</NavSubLink>
                <NavSubLink href="/master-data/warehouses">Warehouses</NavSubLink>
                <NavSubLink href="/master-data/customers">Customers</NavSubLink>
                <NavSubLink href="/master-data/suppliers">Suppliers</NavSubLink>
                <NavSubLink href="/master-data/partners">Partners</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="Inventory" icon={<Boxes />}>
                <NavSubLink href="/inventory/stock-in">Stock In</NavSubLink>
                <NavSubLink href="/inventory/stock-out">Stock Out</NavSubLink>
                <NavSubLink href="/inventory/transfer">Stock Transfer</NavSubLink>
                <NavSubLink href="/inventory/adjustment">Stock Adjustment</NavSubLink>
            </NavCollapsible>

             <NavCollapsible title="Accounting" icon={<BookUser />}>
                <NavSubLink href="/accounting/journal">Journal Entries</NavSubLink>
                <NavSubLink href="/accounting/ai-analysis">AI Financial Analysis</NavSubLink>
            </NavCollapsible>

            <NavCollapsible title="Reports" icon={<AreaChart />}>
                <NavSubLink href="/reports/financial-statements">Financial Statements</NavSubLink>
                <NavSubLink href="/reports/partner-shares">Partner Shares</NavSubLink>
            </NavCollapsible>

            <NavLink href="/users" icon={<UserCog />}>Users & Permissions</NavLink>
            <NavLink href="/settings" icon={<Settings />}>Settings</NavLink>

          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent m-2">
                <Avatar>
                    <AvatarImage src="https://placehold.co/100x100.png" />
                    <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="font-semibold text-sm">Admin User</span>
                    <span className="text-xs text-muted-foreground">admin@example.com</span>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1">
                {/* Header content can go here */}
            </div>
        </header>
        {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
