import { currentUser } from "@clerk/nextjs/server";
import HeroSection from "@/components/HeroSection";
import Dashboard from "@/components/Dashboard";

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return <HeroSection />;
  }

  return <Dashboard />;
}
