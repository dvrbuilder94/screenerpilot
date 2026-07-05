import { TrendingUp, TrendingDown } from "lucide-react";

const rows = [
  { sym: "SPY", name: "S&P 500", price: "588.42", chg: "+0.42%", up: true },
  { sym: "QQQ", name: "Nasdaq 100", price: "512.18", chg: "+0.71%", up: true },
  { sym: "^VIX", name: "Volatility", price: "14.22", chg: "-2.10%", up: false },
  { sym: "GC=F", name: "Gold", price: "2,684.10", chg: "+0.35%", up: true },
  { sym: "CL=F", name: "WTI Crude", price: "72.14", chg: "-1.08%", up: false },
  { sym: "BTC", name: "Bitcoin", price: "98,240", chg: "+1.92%", up: true },
];

export const TerminalDemo = () => {
  return (
    <div className="rounded-2xl bg-[#0B0D14] border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <div className="ml-3 text-[11px] uppercase tracking-[0.15em] text-zinc-500">
          ScreenerPilot · Live Terminal
        </div>
      </div>
      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {rows.map((r) => (
          <div
            key={r.sym}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/5"
          >
            <div>
              <div className="text-[11px] text-zinc-500 uppercase tracking-wider">{r.sym}</div>
              <div className="text-sm text-zinc-200">{r.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm text-zinc-100">{r.price}</div>
              <div
                className={`font-mono text-xs flex items-center justify-end gap-1 ${
                  r.up ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {r.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {r.chg}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalDemo;
