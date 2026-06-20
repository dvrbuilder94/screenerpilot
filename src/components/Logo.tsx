import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("flex-shrink-0", className)} aria-hidden="true">
      <defs>
        <linearGradient id="sp-logo-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#sp-logo-grad)" />
      <path
        d="M9 20.5V13.5M16 20.5V9M23 20.5V15.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className, wordmarkClassName }: { className?: string; wordmarkClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="w-8 h-8 sm:w-9 sm:h-9" />
      <div className="hidden md:flex flex-col leading-none min-w-0">
        <span className={cn("text-[15px] font-semibold tracking-tight text-foreground truncate", wordmarkClassName)}>
          ScreenerPilot
        </span>
        <span className="hidden xl:block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mt-0.5 truncate">
          Macro Intelligence Terminal
        </span>
      </div>
    </div>
  );
}
