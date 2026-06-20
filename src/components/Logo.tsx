import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("flex-shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="28"
        height="28"
        rx="7"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M13 25 L19 19 L23 22 L27 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="15" r="2" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className, wordmarkClassName }: { className?: string; wordmarkClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5 text-foreground", className)}>
      <LogoMark className="w-7 h-7 sm:w-8 sm:h-8" />
      <div className="hidden md:flex flex-col leading-none min-w-0">
        <span className={cn("text-[15px] font-semibold tracking-tight truncate", wordmarkClassName)}>
          ScreenerPilot
        </span>
        <span className="hidden xl:block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mt-0.5 truncate">
          Macro Intelligence Terminal
        </span>
      </div>
    </div>
  );
}

