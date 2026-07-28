// The signature hero orb — a soft matte sphere with a slowly rotating plasma
// shimmer inside, a breathing halo, and electrons orbiting on tilted rings.
// Pure CSS + SVG, no libraries. Respects reduced motion.
export function OrbHero({ className = "" }: { className?: string }) {
  return (
    <div className={`orbh ${className}`} aria-hidden>
      <style>{`
        .orbh { position: relative; width: 100%; max-width: 460px; aspect-ratio: 1; margin: 0 auto; }
        .orbh__halo { position: absolute; inset: 8%; border-radius: 50%;
          background: radial-gradient(circle, hsl(230 70% 72% / .40), transparent 66%);
          filter: blur(34px); animation: orbh-breathe 7s ease-in-out infinite; }
        .orbh__float { position: absolute; inset: 0; display: grid; place-items: center;
          animation: orbh-float 9s ease-in-out infinite; }
        .orbh__core { position: relative; width: 64%; aspect-ratio: 1; border-radius: 50%;
          overflow: hidden; isolation: isolate;
          background:
            radial-gradient(circle at 36% 30%, rgba(255,255,255,.62), transparent 42%),
            radial-gradient(circle at 72% 76%, rgba(28,36,70,.55), transparent 52%),
            radial-gradient(132% 132% at 42% 36%, #cfd6f1 0%, #a7b2df 42%, #8590c8 66%, #6a76ad 100%);
          box-shadow: 0 44px 90px -26px rgba(12,16,36,.75),
            inset -16px -22px 54px rgba(38,46,86,.5), inset 14px 16px 44px rgba(240,244,255,.5); }
        .orbh__plasma { position: absolute; inset: -34%; mix-blend-mode: screen; opacity: .75;
          background: conic-gradient(from 0deg, rgba(142,155,227,0), rgba(110,200,240,.42),
            rgba(142,155,227,0), rgba(178,150,240,.34), rgba(142,155,227,0));
          filter: blur(20px); animation: orbh-spin 20s linear infinite; }
        .orbh__sheen { position: absolute; top: 12%; left: 20%; width: 42%; height: 26%; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,.5), transparent 70%); filter: blur(4px); }
        .orbh__rings { position: absolute; inset: 0; }
        .orbh__e { fill: #dfe6ff; filter: drop-shadow(0 0 4px hsl(200 80% 70% / .9)); }
        @keyframes orbh-float { 0%,100% { transform: translateY(-2.5%); } 50% { transform: translateY(2.5%); } }
        @keyframes orbh-spin { to { transform: rotate(360deg); } }
        @keyframes orbh-breathe { 0%,100% { opacity: .5; transform: scale(.97); } 50% { opacity: .85; transform: scale(1.04); } }
        @media (prefers-reduced-motion: reduce) {
          .orbh__float, .orbh__plasma, .orbh__halo { animation: none; }
        }
      `}</style>

      <div className="orbh__halo" />
      <div className="orbh__float">
        <div className="orbh__core">
          <div className="orbh__plasma" />
          <div className="orbh__sheen" />
        </div>
      </div>

      <svg className="orbh__rings" viewBox="0 0 100 100" fill="none">
        <g stroke="hsl(230 60% 80% / .22)" strokeWidth="0.4">
          <ellipse cx="50" cy="50" rx="47" ry="16" transform="rotate(18 50 50)" />
          <ellipse cx="50" cy="50" rx="43" ry="15" transform="rotate(-26 50 50)" />
          <ellipse cx="50" cy="50" rx="45" ry="16" transform="rotate(74 50 50)" />
        </g>
        <path id="orbh-p1" d="M3,50 a47,16 0 1,0 94,0 a47,16 0 1,0 -94,0" transform="rotate(18 50 50)" />
        <path id="orbh-p2" d="M7,50 a43,15 0 1,0 86,0 a43,15 0 1,0 -86,0" transform="rotate(-26 50 50)" />
        <path id="orbh-p3" d="M5,50 a45,16 0 1,0 90,0 a45,16 0 1,0 -90,0" transform="rotate(74 50 50)" />
        <circle className="orbh__e" r="1.5"><animateMotion dur="7s" repeatCount="indefinite"><mpath href="#orbh-p1" /></animateMotion></circle>
        <circle className="orbh__e" r="1.3"><animateMotion dur="9s" repeatCount="indefinite"><mpath href="#orbh-p2" /></animateMotion></circle>
        <circle className="orbh__e" r="1.1"><animateMotion dur="6s" repeatCount="indefinite"><mpath href="#orbh-p3" /></animateMotion></circle>
      </svg>
    </div>
  );
}

export default OrbHero;
