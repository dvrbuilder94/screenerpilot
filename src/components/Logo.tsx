import { cn } from "@/lib/utils";

/**
 * Minimalist monogram. Uses currentColor so it inherits from the surface —
 * black on white in the marketing site, white on black inside the terminal.
 * No gradients, no drop shadows, no cyan/blue — just brand type.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("flex-shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <rect x="1" y="1" width="30" height="30" rx="7" stroke="currentColor" strokeWidth="1.5" />
      {/* Simple ascending chart glyph */}
      <path
        d="M8 21 L14 15 L18 18 L24 11"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="11" r="1.75" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className,
  wordmarkClassName,
  showWordmark = true,
}: {
  className?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2 text-foreground", className)}>
      <LogoMark className="w-7 h-7" />
      {showWordmark && (
        <span
          className={cn(
            "text-[15px] font-semibold tracking-tight leading-none hidden sm:inline",
            wordmarkClassName
          )}
        >
          ScreenerPilot
        </span>
      )}
    </div>
  );
}
