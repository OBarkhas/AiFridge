import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Refrigerator, ChefHat, CalendarCheck, Bell } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-16">
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-8">
        <div className="flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg shadow-zinc-950/10">
              <Refrigerator className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center shadow-sm">
              <Bell className="w-3.5 h-3.5 text-zinc-700" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-bold text-zinc-900 tracking-tight">
            AI Fridge
            <span className="block text-zinc-500 font-normal text-2xl md:text-3xl mt-2">
              Smart Kitchen Companion
            </span>
          </h1>
        </div>

        <p className="text-base md:text-lg text-zinc-600 max-w-xl mx-auto leading-relaxed">
          Never waste food again. Track your fridge items, get smart recipe
          suggestions, and plan your weekly meals intelligently.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
          {[
            {
              icon: Refrigerator,
              title: "Track Items",
              desc: "Monitor expiry dates and get notified before food goes bad.",
            },
            {
              icon: ChefHat,
              title: "AI Recipes",
              desc: "Get smart recipe suggestions based on what's in your fridge.",
            },
            {
              icon: CalendarCheck,
              title: "Meal Plans",
              desc: "Plan your weekly meals and reduce food waste easily.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all duration-200"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-3 bg-zinc-100 rounded-xl">
                  <feature.icon className="w-6 h-6 text-zinc-800" />
                </div>
                <h3 className="text-zinc-900 font-semibold">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <SignUpButton>
            <button className="w-full sm:w-auto px-7 py-3 bg-zinc-900 text-white font-medium text-sm rounded-xl shadow-sm hover:bg-zinc-800 transition-all duration-200">
              Get Started
            </button>
          </SignUpButton>

          <SignInButton>
            <button className="w-full sm:w-auto px-7 py-3 bg-white text-zinc-700 font-medium text-sm rounded-xl border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900 transition-all duration-200">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    </div>
  );
}
