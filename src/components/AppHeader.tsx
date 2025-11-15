import { TrendingUp } from "lucide-react";
import { AccountDropdown } from "./AccountDropdown";

export const AppHeader = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            ScreenerPilot
          </h1>
        </div>

        {/* Account Module */}
        <AccountDropdown />
      </div>
    </header>
  );
};
