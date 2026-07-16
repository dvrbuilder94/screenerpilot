// Animated "AI pipeline" visual for the landing: raw market data streams in
// from three sources, converge into BEN (the AI engine), and a signal arrives
// at your terminal. Pure SVG — a traveling lime packet on each connector plus
// an arrow that lands. No libraries, no icon clip-art. Respects reduced motion.

const NODE_BG = "#141414";
const LINE = "rgba(255,255,255,0.12)";
const LIME = "#C9F73F";

function Pill({
  x,
  y,
  w,
  label,
}: {
  x: number;
  y: number;
  w: number;
  label: string;
}) {
  const h = 38;
  return (
    <g>
      <rect
        x={x}
        y={y - h / 2}
        width={w}
        height={h}
        rx={10}
        fill={NODE_BG}
        stroke="rgba(255,255,255,0.10)"
      />
      <text
        x={x + w / 2}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="500"
        fill="rgba(255,255,255,0.82)"
        style={{ fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}

export function WorkflowPipeline() {
  // Connector paths (source → BEN, and BEN → terminal), normalized to
  // pathLength=100 so one dash travels the whole length regardless of shape.
  const paths = [
    "M150 66 C 250 66 262 150 350 150", // equities → engine
    "M150 150 C 245 150 262 150 350 150", // crypto → engine
    "M150 234 C 250 234 262 150 350 150", // macro → engine
  ];
  const outPath = "M496 150 L 676 150"; // engine → terminal

  return (
    <div className="wf-wrap">
      <style>{`
        .wf-base { fill: none; stroke: ${LINE}; stroke-width: 1.5; }
        .wf-flow { fill: none; stroke: ${LIME}; stroke-width: 2; stroke-linecap: round;
          stroke-dasharray: 4 100; animation: wf-travel 3s linear infinite; }
        .wf-flow.d1 { animation-delay: 0s; }
        .wf-flow.d2 { animation-delay: .35s; }
        .wf-flow.d3 { animation-delay: .7s; }
        .wf-flow.out { animation-delay: 1.15s; animation-duration: 2.4s; }
        @keyframes wf-travel { from { stroke-dashoffset: 104; } to { stroke-dashoffset: 4; } }
        .wf-arrow { fill: ${LIME}; animation: wf-arrive 3s ease-in-out infinite; }
        @keyframes wf-arrive { 0%,55% { opacity:.35; } 72% { opacity:1; } 100% { opacity:.35; } }
        @media (prefers-reduced-motion: reduce) {
          .wf-flow, .wf-arrow { animation: none; }
          .wf-flow { stroke-dasharray: none; opacity: .5; }
        }
      `}</style>

      <svg
        viewBox="0 0 772 300"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Market data flows through BEN, ScreenerPilot's AI engine, into your terminal"
      >
        <defs>
          <filter id="wf-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base connectors */}
        {paths.map((d, i) => (
          <path key={`b${i}`} className="wf-base" d={d} pathLength={100} />
        ))}
        <path className="wf-base" d={outPath} pathLength={100} />

        {/* Traveling signal packets */}
        <g filter="url(#wf-glow)">
          {paths.map((d, i) => (
            <path key={`f${i}`} className={`wf-flow d${i + 1}`} d={d} pathLength={100} />
          ))}
          <path className="wf-flow out" d={outPath} pathLength={100} />
        </g>

        {/* Arrowhead that "arrives" at the terminal */}
        <polygon className="wf-arrow" points="676,142 692,150 676,158" filter="url(#wf-glow)" />

        {/* Source nodes */}
        <Pill x={40} y={66} w={110} label="Equities" />
        <Pill x={40} y={150} w={110} label="Crypto" />
        <Pill x={40} y={234} w={110} label="Macro" />

        {/* Engine node — BEN */}
        <g>
          {/* pulsing ring */}
          <circle cx={423} cy={150} r={54} fill="none" stroke={LIME} strokeWidth="1">
            <animate attributeName="r" values="46;70" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0" dur="3s" repeatCount="indefinite" />
          </circle>
          <rect
            x={350}
            y={105}
            width={146}
            height={90}
            rx={16}
            fill={NODE_BG}
            stroke="rgba(201,247,63,0.45)"
          />
          <text
            x={423}
            y={140}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="22"
            fontWeight="600"
            fill="#fff"
            style={{ fontFamily: "Inter, system-ui, sans-serif", letterSpacing: "0.02em" }}
          >
            BEN
          </text>
          <text
            x={423}
            y={166}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontWeight="500"
            fill={LIME}
            style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.22em" }}
          >
            AI ENGINE
          </text>
        </g>

        {/* Terminal node */}
        <g>
          <rect
            x={690}
            y={128}
            width={70}
            height={44}
            rx={10}
            fill={NODE_BG}
            stroke="rgba(255,255,255,0.10)"
          />
          <text
            x={725}
            y={144}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="600"
            fill="rgba(255,255,255,0.85)"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            Your
          </text>
          <text
            x={725}
            y={158}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fontWeight="600"
            fill="rgba(255,255,255,0.85)"
            style={{ fontFamily: "Inter, system-ui, sans-serif" }}
          >
            terminal
          </text>
        </g>
      </svg>
    </div>
  );
}

export default WorkflowPipeline;
