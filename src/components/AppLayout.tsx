import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <AppHeader />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
