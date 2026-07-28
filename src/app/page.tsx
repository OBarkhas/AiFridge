import { currentUser } from "@clerk/nextjs/server";
import HeroSection from "@/components/HeroSection";
import DashboardPage from "./DashboardPage";

export default async function Page() {
  const user = await currentUser();

  if (!user) {
    return <HeroSection />;
  }

  return <DashboardPage />;
}
