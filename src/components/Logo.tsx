import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("flex-shrink-0", className)} fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.4" opacity=".35" />
      <circle cx="16" cy="16" r="7.5" stroke="currentColor" strokeWidth="1.4" opacity=".65" />
      <circle cx="16" cy="16" r="2.8" fill="currentColor" />
      <path d="M3 16h6M23 16h6M16 3v6M16 23v6" stroke="currentColor" strokeWidth="1.2" opacity=".5" />
      <circle cx="25.5" cy="8.5" r="1.5" fill="currentColor" opacity=".8" />
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
      <LogoMark className="h-7 w-7" />
      {showWordmark && (
        <span className={cn("hidden sm:inline text-[15px] font-semibold tracking-tight leading-none", wordmarkClassName)}>
          emergent<span className="text-muted-foreground">OS</span>
        </span>
      )}
    </div>
  );
}
