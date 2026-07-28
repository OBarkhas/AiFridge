"use client";

import { useEffect, useState } from "react";
import {
  Refrigerator,
  ChefHat,
  CalendarCheck,
  AlertTriangle,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { ViewType } from "./Sidebar";

interface Item {
  id: string;
  name: string;
  category: string | null;
  amount: string | null;
  expireDate: string;
  createdAt: string;
}

interface Recipe {
  id: string;
  title: string;
}

interface MealPlan {
  id: string;
  dayOfWeek: string;
}

interface OverviewViewProps {
  onNavigate: (view: ViewType) => void;
}

export default function OverviewView({ onNavigate }: OverviewViewProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, recipesRes, mealPlansRes] = await Promise.all([
          fetch("/api/items"),
          fetch("/api/recipes"),
          fetch("/api/meal-plans"),
        ]);
        if (itemsRes.ok) setItems(await itemsRes.json());
        if (recipesRes.ok) setRecipes(await recipesRes.json());
        if (mealPlansRes.ok) setMealPlans(await mealPlansRes.json());
      } catch (err) {
        console.error("Failed to fetch overview data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const totalItems = items.length;
  const expiringSoon = items.filter(
    (item) =>
      new Date(item.expireDate) >= now &&
      new Date(item.expireDate) <= inThreeDays,
  );
  const expired = items.filter((item) => new Date(item.expireDate) < now);
  const totalRecipes = recipes.length;
  const totalMealPlans = mealPlans.length;

  const stats = [
    {
      label: "Total Items",
      value: totalItems,
      icon: Refrigerator,
      view: "items" as ViewType,
      color: "text-zinc-900",
    },
    {
      label: "Expiring Soon",
      value: expiringSoon.length,
      icon: AlertTriangle,
      view: "items" as ViewType,
      color: "text-amber-600",
      sub: "Within 3 days",
    },
    {
      label: "Expired",
      value: expired.length,
      icon: AlertTriangle,
      view: "items" as ViewType,
      color: "text-red-600",
      sub: "Needs attention",
    },
    {
      label: "Recipes",
      value: totalRecipes,
      icon: ChefHat,
      view: "recipes" as ViewType,
      color: "text-zinc-900",
    },
    {
      label: "Meal Plans",
      value: totalMealPlans,
      icon: CalendarCheck,
      view: "meal-plans" as ViewType,
      color: "text-zinc-900",
    },
  ];

  return (
    <div className="animate-fade-in px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Overview of your fridge, recipes, and meal plans.
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, index) => (
          <button
            key={stat.label}
            onClick={() => onNavigate(stat.view)}
            className="card-hover group relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md text-left"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-zinc-50/50 transition-transform duration-500 group-hover:scale-150" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {stat.label}
                  </p>
                  {loading ? (
                    <div className="skeleton h-9 w-16" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight text-zinc-900">
                      {stat.value}
                    </p>
                  )}
                  {stat.sub && (
                    <p className="text-xs text-zinc-400">{stat.sub}</p>
                  )}
                </div>
                <div className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100 transition-all duration-300 group-hover:bg-zinc-100 group-hover:ring-zinc-200">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="animate-slide-in-up rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Expiring Soon
            </h2>
            <button
              onClick={() => onNavigate("items")}
              className="btn-active flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-700"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-5">
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="skeleton h-14" />
                ))}
              </div>
            ) : expiringSoon.length > 0 ? (
              <ul className="space-y-2">
                {expiringSoon.map((item) => {
                  const daysLeft = Math.ceil(
                    (new Date(item.expireDate).getTime() - now.getTime()) /
                      (1000 * 60 * 60 * 24),
                  );
                  return (
                    <li
                      key={item.id}
                      className="card-hover flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3 transition-all duration-200 hover:border-amber-200 hover:bg-amber-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {item.name}
                        </p>
                        {item.amount && (
                          <p className="text-xs text-zinc-500">{item.amount}</p>
                        )}
                      </div>
                      <span className="ml-3 flex-shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        {daysLeft === 0
                          ? "Today"
                          : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
                  <Refrigerator className="h-6 w-6 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-500">No items expiring soon</p>
                <button
                  onClick={() => onNavigate("items")}
                  className="btn-active mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-zinc-800"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add items to your fridge
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="animate-slide-in-up rounded-2xl border border-zinc-200/80 bg-white shadow-sm" style={{ animationDelay: "100ms" }}>
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => onNavigate("items")}
                className="card-hover group flex items-center gap-4 rounded-xl border border-zinc-200/80 px-4 py-3.5 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50/80 text-left active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
                  <Plus className="h-5 w-5 text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Add New Item
                  </p>
                  <p className="text-xs text-zinc-500">
                    Record a new item in your fridge
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigate("recipes")}
                className="card-hover group flex items-center gap-4 rounded-xl border border-zinc-200/80 px-4 py-3.5 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50/80 text-left active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
                  <ChefHat className="h-5 w-5 text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Browse Recipes
                  </p>
                  <p className="text-xs text-zinc-500">
                    Find recipes from your available items
                  </p>
                </div>
              </button>

              <button
                onClick={() => onNavigate("meal-plans")}
                className="card-hover group flex items-center gap-4 rounded-xl border border-zinc-200/80 px-4 py-3.5 transition-all duration-200 hover:border-zinc-300 hover:bg-zinc-50/80 text-left active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
                  <CalendarCheck className="h-5 w-5 text-zinc-700" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900">
                    Plan Meals
                  </p>
                  <p className="text-xs text-zinc-500">
                    Organize your weekly meal schedule
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
