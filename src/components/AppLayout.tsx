import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <PaymentTestModeBanner />
      <AppHeader />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
