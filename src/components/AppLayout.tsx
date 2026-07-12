import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { TradingAIWidget } from "@/components/TradingAIWidget";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background overflow-x-hidden">
      <PaymentTestModeBanner />
      <AppHeader />
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-16 lg:pb-0">
        {children}
      </main>
      <TradingAIWidget />
      <MobileBottomBar />
    </div>
  );
}
