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
  mobileLabel: string;
  isRoute?: boolean;
  href?: string;
}[] = [
  {
    view: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    mobileLabel: "Home",
  },
  {
    view: "items",
    label: "Fridge Items",
    icon: Refrigerator,
    mobileLabel: "Fridge",
  },
  { view: "recipes", label: "Recipes", icon: ChefHat, mobileLabel: "Recipes" },
  {
    view: "meal-plans",
    label: "Meal Plans",
    icon: CalendarCheck,
    mobileLabel: "Plans",
  },
  { view: "ai", label: "AI Chat", icon: Bot, mobileLabel: "AI" },
  {
    view: "community",
    label: "Community",
    icon: Globe,
    mobileLabel: "Community",
    isRoute: true,
    href: "/community",
  },
  { view: "profile", label: "Profile", icon: User, mobileLabel: "Profile" },
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
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-zinc-200/80 bg-white/95 backdrop-blur-xl md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-100 px-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:bg-zinc-800">
              <Refrigerator className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-sm font-semibold tracking-tight text-zinc-900">
                AI Fridge
              </h1>
              <p className="text-[11px] text-zinc-400">Smart Kitchen</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-3 px-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">
              Menu
            </p>
          </div>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.view}>
                  <button
                    onClick={() => handleClick(item)}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                    }`}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-zinc-900" />
                    )}
                    <item.icon
                      className={`h-4.5 w-4.5 flex-shrink-0 transition-transform duration-200 ${
                        active
                          ? "text-zinc-900"
                          : "text-zinc-400 group-hover:scale-110"
                      }`}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto rounded-full bg-zinc-900/5 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                        Active
                      </span>
                    )}
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
              className="flex items-center gap-3 flex-1 min-w-0 group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-600 ring-1 ring-zinc-200 transition-all duration-200 group-hover:ring-zinc-400">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-600 active:scale-95"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </SignOutButton>
          </div>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200/80 bg-white/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around px-1 py-1">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.view}
                onClick={() => handleClick(item)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-all duration-200 ${
                  active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {active && (
                  <span className="absolute -top-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-zinc-900" />
                )}
                <item.icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    active ? "scale-110" : ""
                  }`}
                />
                <span className="leading-tight">{item.mobileLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
