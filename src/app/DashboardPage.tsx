"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar, { type ViewType } from "@/components/Sidebar";
import OverviewView from "@/components/OverviewView";
import ItemsView from "@/components/ItemsView";
import RecipesView from "@/components/RecipesView";
import MealPlansView from "@/components/MealPlansView";
import AIView from "@/components/AIView";

function DashboardView() {
  const searchParams = useSearchParams();
  const initialView = (searchParams.get("view") as ViewType) ?? "overview";
  const highlightItemId = searchParams.get("highlight") ?? undefined;
  const [activeView, setActiveView] = useState<ViewType>(initialView);
  const [pendingAIPrompt, setPendingAIPrompt] = useState<string | null>(null);

  const handleAskAI = useCallback((recipeTitle: string) => {
    setPendingAIPrompt(
      `How do I prepare ${recipeTitle}? Can you give me the step-by-step recipe and cooking tips?`,
    );
    setActiveView("ai");
  }, []);

  const handleAISent = useCallback(() => {
    setPendingAIPrompt(null);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case "overview":
        return <OverviewView onNavigate={setActiveView} />;
      case "items":
        return <ItemsView highlightItemId={highlightItemId} />;
      case "recipes":
        return <RecipesView />;
      case "meal-plans":
        return <MealPlansView onAskAI={handleAskAI} />;
      case "ai":
        return (
          <AIView
            initialPrompt={pendingAIPrompt}
            onPromptSent={handleAISent}
          />
        );
      default:
        return <OverviewView onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="ml-0 flex-1 pb-20 md:ml-64 md:pb-0">{renderView()}</main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-50"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" /></div>}>
      <DashboardView />
    </Suspense>
  );
}
