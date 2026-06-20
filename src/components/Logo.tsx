import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 36" className={cn("flex-shrink-0", className)} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sp-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <mask id="sp-logo-cut">
          <rect x="0" y="0" width="40" height="36" fill="white" />
          <rect x="13.5" y="11.5" width="9" height="9" rx="2" fill="black" />
        </mask>
      </defs>

      {/* Frosted square (back) */}
      <rect
        x="2"
        y="9"
        width="22"
        height="22"
        rx="6.5"
        fill="white"
        fillOpacity="0.14"
        stroke="white"
        strokeOpacity="0.55"
        strokeWidth="1.2"
      />

      {/* Gradient square (front, overlapping, with square cutout) */}
      <rect
        x="10"
        y="3"
        width="22"
        height="22"
        rx="6.5"
        fill="url(#sp-logo-grad)"
        mask="url(#sp-logo-cut)"
      />

      {/* Vertical accent bar */}
      <rect x="34.5" y="5" width="5" height="26" rx="2.5" fill="url(#sp-logo-grad)" />
    </svg>
  );
}

export function Logo({ className, wordmarkClassName }: { className?: string; wordmarkClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoMark className="w-8 h-[26px] sm:w-9 sm:h-[28px]" />
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
