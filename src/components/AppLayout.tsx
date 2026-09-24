import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MobileBottomBar } from "@/components/MobileBottomBar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground overflow-x-hidden">
      <AppHeader />
      <main className="flex-1 w-full pb-16 lg:pb-0">{children}</main>
      <MobileBottomBar />
    </div>
  );
}
