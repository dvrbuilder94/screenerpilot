import { ReactNode } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen w-full bg-background overflow-x-hidden">
      <PaymentTestModeBanner />
      <AppHeader />
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
