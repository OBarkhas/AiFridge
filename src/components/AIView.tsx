"use client";

import { useState } from "react";
import { Bot, Send, User, Sparkles, PlusCircle, Calendar } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AIView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Sain baina uu! Bi tanyi AI Kitchen Assistant baina. Horgogchind baigaa zuyleseer tanyi yamar hool hiij bolohiig zaaj ogoh uu?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 1. AI-aas irsen jooroo Recipes ruu importloj avah
  const importRecipe = async (recipeJson: string) => {
    try {
      const parsed = JSON.parse(recipeJson);
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (res.ok) {
        alert(`"${parsed.title}" amjilttai Recipes ruu hadgalagdlaa!`);
      } else {
        alert("Recipe import hiilhed aldaa garlaa.");
      }
    } catch (e) {
      console.error(e);
      alert("Recipe import hiilhed aldaa garlaa.");
    }
  };

  // 2. AI-aas irsen 7 honogiin huvaariig Meal Plans ruu importloj avah
  const importSchedule = async (scheduleJson: string) => {
    try {
      const items = JSON.parse(scheduleJson);
      for (const item of items) {
        await fetch("/api/meal-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }
      alert("7 honogiin huvaari amjilttai Meal Plans ruu nemegdlee!");
    } catch (e) {
      console.error(e);
      alert("Schedule import hiilhed aldaa garlaa.");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-200">
        <Sparkles className="w-5 h-5 text-zinc-900" />
        <h1 className="font-semibold text-lg text-zinc-900">
          AI Kitchen Assistant
        </h1>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.map((m, idx) => {
          const recipeMatch = m.content.match(
            /
http://googleusercontent.com/immersive_entry_chip/0
http://googleusercontent.com/immersive_entry_chip/1
http://googleusercontent.com/immersive_entry_chip/2
http://googleusercontent.com/immersive_entry_chip/3