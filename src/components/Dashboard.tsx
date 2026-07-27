"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import OverviewView from "./OverviewView";
import ItemsView from "./ItemsView";
import RecipesView from "./RecipesView";
import MealPlansView from "./MealPlansView";
import type { ViewType } from "./Sidebar";

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewType>("overview");

  const renderView = () => {
    switch (activeView) {
      case "overview":
        return <OverviewView onNavigate={setActiveView} />;
      case "items":
        return <ItemsView />;
      case "recipes":
        return <RecipesView />;
      case "meal-plans":
        return <MealPlansView />;
    }
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="ml-64 flex-1">{renderView()}</main>
    </div>
  );
}
