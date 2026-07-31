import { cn } from "@/lib/utils";

/**
 * Brand mark — the ScreenerPilot orb: a matte periwinkle sphere with two tilted
 * orbital rings (the "atomic core"). Fixed brand colors (not currentColor), so
 * it reads the same on every surface and matches the hero orb + token image.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("flex-shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="sp-orb" cx="0.5" cy="0.5" r="0.6" fx="0.36" fy="0.30">
          <stop offset="0%" stopColor="#EAF0FF" />
          <stop offset="32%" stopColor="#C2CBEE" />
          <stop offset="64%" stopColor="#8E9BE3" />
          <stop offset="100%" stopColor="#65719C" />
        </radialGradient>
      </defs>
      {/* Orbital rings */}
      <g stroke="#A9B4FF" strokeOpacity="0.55" strokeWidth="1">
        <ellipse cx="16" cy="16" rx="14.5" ry="5.2" transform="rotate(24 16 16)" />
        <ellipse cx="16" cy="16" rx="13.5" ry="5" transform="rotate(-30 16 16)" />
      </g>
      {/* Sphere */}
      <circle cx="16" cy="16" r="10.5" fill="url(#sp-orb)" />
      {/* Specular highlight */}
      <ellipse cx="12.4" cy="11.4" rx="3.4" ry="2.2" fill="#FFFFFF" opacity="0.45" transform="rotate(-24 12.4 11.4)" />
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
