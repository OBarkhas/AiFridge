"use client";

import { useUser, SignOutButton } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import {
  Refrigerator,
  ChefHat,
  CalendarCheck,
  LayoutDashboard,
  LogOut,
  Bot,
  Globe,
  User,
} from "lucide-react";

export type ViewType =
  | "overview"
  | "items"
  | "recipes"
  | "meal-plans"
  | "ai"
  | "profile";

export interface SidebarProps {
  activeView?: ViewType;
  onViewChange?: (view: ViewType) => void;
}

const navItems: {
  view: ViewType | "community";
  label: string;
  icon: typeof LayoutDashboard;
  isRoute?: boolean;
  href?: string;
}[] = [
  { view: "overview", label: "Overview", icon: LayoutDashboard },
  { view: "items", label: "Fridge Items", icon: Refrigerator },
  { view: "recipes", label: "Recipes", icon: ChefHat },
  { view: "meal-plans", label: "Meal Plans", icon: CalendarCheck },
  { view: "ai", label: "AI Chat", icon: Bot },
  {
    view: "community",
    label: "Community",
    icon: Globe,
    isRoute: true,
    href: "/community",
  },
  { view: "profile", label: "Profile", icon: User },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (item: (typeof navItems)[number]) => {
    if (item.view === "profile" && user?.id) {
      router.push(`/user/${user.id}`);
      return;
    }
    if (item.isRoute && item.href) {
      router.push(item.href);
    } else if (onViewChange) {
      onViewChange(item.view as ViewType);
    } else {
      router.push(`/?view=${item.view}`);
    }
  };

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.view === "profile" && user?.id) {
      return pathname === `/user/${user.id}`;
    }
    if (item.isRoute && item.href) {
      return pathname.startsWith(item.href);
    }
    if (pathname !== "/") return false;
    return activeView === item.view;
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-6">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 shadow-sm">
            <Refrigerator className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-semibold text-zinc-900">AI Fridge</h1>
            <p className="text-[11px] text-zinc-400">Smart Kitchen</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.view}>
                <button
                  onClick={() => handleClick(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"
                  }`}
                >
                  <item.icon
                    className={`h-4.5 w-4.5 flex-shrink-0 ${
                      active ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/user/${user?.id}`)}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
              {user?.firstName?.charAt(0) ??
                user?.emailAddresses?.[0]?.emailAddress?.charAt(0) ??
                "?"}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-zinc-900">
                {user?.fullName ?? "User"}
              </p>
              <p className="truncate text-xs text-zinc-400">
                {user?.emailAddresses?.[0]?.emailAddress ?? ""}
              </p>
            </div>
          </button>
          <SignOutButton redirectUrl="/">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}
