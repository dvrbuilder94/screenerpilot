import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={cn("flex-shrink-0", className)} fill="none" aria-hidden="true">
      <rect x="4" y="5" width="26" height="6" rx="1" fill="currentColor" />
      <rect x="4" y="17" width="32" height="6" rx="1" fill="currentColor" />
      <rect x="4" y="29" width="26" height="6" rx="1" fill="currentColor" />
      <path
        d="M40 6 L60 20 L40 34"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

export function Logo({ className, wordmarkClassName }: { className?: string; wordmarkClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="w-8 h-5 sm:w-9 sm:h-[22px] text-cyan-400" />
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
