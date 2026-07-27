"use client";

import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import OverviewView from "./OverviewView";
import ItemsView from "./ItemsView";
import RecipesView from "./RecipesView";
import MealPlansView from "./MealPlansView";
import AIView from "./AIView";
import type { ViewType } from "./Sidebar";

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>("overview");
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
        return <ItemsView />;
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
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="ml-64 flex-1">{renderView()}</main>
    </div>
  );
}
