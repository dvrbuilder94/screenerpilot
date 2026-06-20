import { useCallback, useRef, useState } from "react";

export function BenMascot() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = (e.clientX - cx) / (rect.width / 2);
    const y = (e.clientY - cy) / (rect.height / 2);
    setPos({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  }, []);

  const handleMouseLeave = useCallback(() => setPos({ x: 0, y: 0 }), []);

  const eyeX = pos.x * 4;
  const eyeY = pos.y * 3;
  const rotateY = pos.x * 10;
  const rotateX = pos.y * -8;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hidden lg:flex relative w-64 h-64 flex-shrink-0 items-center justify-center"
      style={{ perspective: "700px" }}
    >
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2.5rem] opacity-70 blur-2xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(34,211,238,0.35), rgba(59,130,246,0.22), transparent)",
        }}
      />

      <div
        className="relative w-full h-full rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col items-center justify-center"
        style={{ background: "radial-gradient(circle at 30% 20%, #1e293b, #0a0f1c)" }}
      >
        <div className="absolute top-5 left-0 right-0 flex flex-col items-center">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[15px] font-bold text-white tracking-tight">BEN</span>
            <span className="text-[15px] font-bold text-cyan-400 tracking-tight">AI</span>
          </div>
          <span className="text-[8.5px] uppercase tracking-[0.16em] text-white/45 mt-1">
            Market Intelligence Copilot
          </span>
        </div>

        <div
          className="transition-transform duration-150 ease-out"
          style={{ transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg)` }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="ben-mascot-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#22D3EE" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>

            <line x1="60" y1="14" x2="60" y2="28" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
            <circle cx="60" cy="10" r="5" fill="#22d3ee" className="animate-pulse" />

            <rect x="22" y="28" width="76" height="64" rx="20" fill="url(#ben-mascot-grad)" />
            <rect x="22" y="28" width="76" height="64" rx="20" fill="white" fillOpacity="0.05" />

            <rect x="36" y="50" width="48" height="24" rx="12" fill="#0a0f1c" />
            <circle cx={48 + eyeX} cy={62 + eyeY} r="6" fill="#22d3ee" />
            <circle cx={72 + eyeX} cy={62 + eyeY} r="6" fill="#22d3ee" />
          </svg>
        </div>

        <div className="mt-1 w-24 h-3 rounded-full bg-black/40 blur-[3px]" />
      </div>
    </div>
  );
}
