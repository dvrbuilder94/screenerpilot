import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketSnapshots, MarketSnapshot } from "@/hooks/useMarketSnapshots";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const TABS = [
  { id: "today",       label: "Today" },
  { id: "sectors",     label: "Sectors" },
  { id: "factors",     label: "Factors" },
  { id: "yields",      label: "Yields" },
  { id: "currencies",  label: "Currencies" },
  { id: "commodities", label: "Commodities" },
  { id: "countries",   label: "Countries" },
];

function fmtNum(n: number | null | undefined, opts: Intl.NumberFormatOptions = {}) {
  if (n == null || !isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, ...opts }).format(n);
}

function PctBadge({ value }: { value: number | null | undefined }) {
  if (value == null || !isFinite(value)) {
    return <span className="badge-neutral">—</span>;
  }
  const cls = value >= 0 ? "badge-positive" : "badge-negative";
  const sign = value >= 0 ? "+" : "";
  return <span className={cls}>{sign}{value.toFixed(2)}%</span>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mt-6 mb-2 px-1">
      {children}
    </h3>
  );
}

function findBy(rows: MarketSnapshot[], symbol: string) {
  return rows.find((r) => r.symbol === symbol);
}
function filterBy(rows: MarketSnapshot[], symbols: string[]): MarketSnapshot[] {
  const map = new Map(rows.map((r) => [r.symbol, r]));
  return symbols.map((s) => map.get(s)).filter(Boolean) as MarketSnapshot[];
}

interface Col {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: MarketSnapshot) => React.ReactNode;
}

function MarketTable({ rows, cols }: { rows: MarketSnapshot[]; cols: Col[] }) {
  if (rows.length === 0) {
    return (
      <div className="fin-card p-6 text-center text-sm text-muted-foreground">
        No data yet. The collector runs every 15 minutes.
      </div>
    );
  }
  return (
    <div className="fin-card overflow-x-auto">
      <table className="fin-table">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.key} className={cn(c.align === "right" && "text-right")}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol}>
              {cols.map((c) => (
                <td key={c.key} className={cn(c.align === "right" && "text-right")}>
                  {c.render(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const COL_NAME: Col = {
  key: "name", label: "Name",
  render: (r) => (
    <div className="flex items-center gap-2">
      <span className="font-medium text-foreground">{r.display_name}</span>
      <span className="text-[11px] text-muted-foreground font-mono-tabular">{r.symbol}</span>
    </div>
  ),
};
const COL_LAST: Col = {
  key: "last", label: "Last", align: "right",
  render: (r) => <span className="font-mono-tabular">{fmtNum(r.current_price)}</span>,
};
const COL_1D_CHG: Col = {
  key: "chg", label: "1D Chg", align: "right",
  render: (r) => (
    <span className={cn("font-mono-tabular", (r.change_1d ?? 0) >= 0 ? "text-positive" : "text-negative")}>
      {(r.change_1d ?? 0) >= 0 ? "+" : ""}{fmtNum(r.change_1d)}
    </span>
  ),
};
const COL_1D_PCT: Col = { key: "1d", label: "1D %",  align: "right", render: (r) => <PctBadge value={r.change_pct_1d} /> };
const COL_1M_PCT: Col = { key: "1m", label: "1M %",  align: "right", render: (r) => <PctBadge value={r.change_pct_1m} /> };
const COL_YTD:    Col = { key: "ytd", label: "YTD %", align: "right", render: (r) => <PctBadge value={r.change_pct_ytd} /> };
const COL_1Y:     Col = { key: "1y", label: "1Y %",  align: "right", render: (r) => <PctBadge value={r.change_pct_1y} /> };

function StatCard({ row, suffix }: { row?: MarketSnapshot; suffix?: string }) {
  if (!row) {
    return (
      <div className="fin-card p-4">
        <div className="h-12 animate-pulse bg-muted/30 rounded" />
      </div>
    );
  }
  const v = row.change_pct_1d;
  const positive = (v ?? 0) >= 0;
  return (
    <div className="fin-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground font-medium">
          {row.display_name}
        </span>
        <span className="text-[10px] font-mono-tabular text-muted-foreground">{row.symbol}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono-tabular font-semibold text-foreground">
          {fmtNum(row.current_price)}
          {suffix && <span className="text-sm text-muted-foreground ml-1">{suffix}</span>}
        </span>
      </div>
      <div className="mt-1">
        <span className={cn("text-xs font-mono-tabular", positive ? "text-positive" : "text-negative")}>
          {positive ? "+" : ""}{fmtNum(v)}%
        </span>
      </div>
    </div>
  );
}

function TodayTab({ rows }: { rows: MarketSnapshot[] }) {
  const usEquity = filterBy(rows, ["SPY", "QQQ", "DIA", "IWM", "^VIX"]);
  return (
    <>
      <SectionTitle>US Equity Markets</SectionTitle>
      <MarketTable rows={usEquity} cols={[COL_NAME, COL_LAST, COL_1D_CHG, COL_1D_PCT, COL_YTD]} />

      <SectionTitle>Global Snapshot</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard row={findBy(rows, "DX-Y.NYB")} />
        <StatCard row={findBy(rows, "GC=F")} />
        <StatCard row={findBy(rows, "CL=F")} />
        <StatCard row={findBy(rows, "^TNX")} suffix="%" />
      </div>
    </>
  );
}
function SectorsTab({ rows }: { rows: MarketSnapshot[] }) {
  return (
    <>
      <SectionTitle>US Sector ETFs</SectionTitle>
      <MarketTable rows={rows.filter((r) => r.category === "sector")} cols={[COL_NAME, COL_LAST, COL_1D_CHG, COL_1D_PCT, COL_1M_PCT, COL_YTD]} />
    </>
  );
}
function FactorsTab({ rows }: { rows: MarketSnapshot[] }) {
  return (
    <>
      <SectionTitle>Factor & Style Analysis</SectionTitle>
      <MarketTable rows={rows.filter((r) => r.category === "factor")} cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_1M_PCT, COL_1Y]} />
      <p className="text-xs text-muted-foreground mt-3 px-1">
        Tracks style ETFs vs. the broad market. 1M / 1Y % helps identify factor rotations.
      </p>
    </>
  );
}
function YieldsTab({ rows }: { rows: MarketSnapshot[] }) {
  const usYields = filterBy(rows, ["^IRX", "^FVX", "^TNX", "^TYX"]);
  return (
    <>
      <SectionTitle>US Treasury Yield Curve</SectionTitle>
      <MarketTable
        rows={usYields}
        cols={[
          { key: "mat", label: "Maturity", render: (r) => <span className="font-medium">{r.display_name}</span> },
          { key: "y", label: "Yield", align: "right",
            render: (r) => <span className="font-mono-tabular">{fmtNum(r.current_price)}%</span> },
          { key: "1d", label: "1D Chg", align: "right",
            render: (r) => (
              <span className={cn("font-mono-tabular", (r.change_1d ?? 0) >= 0 ? "text-positive" : "text-negative")}>
                {(r.change_1d ?? 0) >= 0 ? "+" : ""}{fmtNum(r.change_1d, { maximumFractionDigits: 3 })}
              </span>
            ) },
          COL_1M_PCT,
        ]}
      />
      <p className="text-xs text-muted-foreground mt-3 px-1">
        Yields shown in %. A flattening curve historically precedes recessions.
      </p>
    </>
  );
}
function CurrenciesTab({ rows }: { rows: MarketSnapshot[] }) {
  const latam  = filterBy(rows, ["USDCLP=X", "USDBRL=X", "USDMXN=X", "USDCOP=X", "USDPEN=X", "USDARS=X"]);
  const majors = filterBy(rows, ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "AUDUSD=X", "USDCAD=X"]);
  const dxy    = findBy(rows, "DX-Y.NYB");
  return (
    <>
      <SectionTitle>LATAM FX</SectionTitle>
      <MarketTable rows={latam}  cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_1M_PCT, COL_1Y]} />
      <SectionTitle>Major Pairs</SectionTitle>
      <MarketTable rows={majors} cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_1M_PCT, COL_1Y]} />
      <SectionTitle>US Dollar Index</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <StatCard row={dxy} />
        <div className="fin-card p-4 text-xs text-muted-foreground">
          DXY measures USD vs a basket of major currencies. A rising DXY typically pressures
          risk assets and LATAM FX.
        </div>
      </div>
    </>
  );
}
function CommoditiesTab({ rows }: { rows: MarketSnapshot[] }) {
  return (
    <>
      <SectionTitle>Energy</SectionTitle>
      <MarketTable rows={filterBy(rows, ["CL=F", "BZ=F", "NG=F", "RB=F", "HO=F"])} cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_1M_PCT, COL_1Y]} />
      <SectionTitle>Metals</SectionTitle>
      <MarketTable rows={filterBy(rows, ["GC=F", "SI=F", "HG=F", "PL=F", "PA=F"])} cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_1M_PCT, COL_1Y]} />
      <SectionTitle>Soft Commodities</SectionTitle>
      <MarketTable rows={filterBy(rows, ["ZC=F", "ZW=F", "ZS=F", "SB=F", "KC=F", "CT=F"])} cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_1M_PCT, COL_1Y]} />
    </>
  );
}
function CountriesTab({ rows }: { rows: MarketSnapshot[] }) {
  const americas = filterBy(rows, ["SPY", "ECH", "EWZ", "EWW", "EPU", "GXG", "ARGT", "EWC"]);
  const row      = rows.filter((r) => r.category === "country" && (r.region === "europe" || r.region === "asia"));
  return (
    <>
      <SectionTitle>Americas — Country ETFs</SectionTitle>
      <MarketTable rows={americas} cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_YTD, COL_1Y]} />
      <SectionTitle>Rest of World</SectionTitle>
      <MarketTable rows={row}      cols={[COL_NAME, COL_LAST, COL_1D_PCT, COL_YTD, COL_1Y]} />
    </>
  );
}

const Markets = () => {
  const [tab, setTab] = useState("today");
  const { data: rows = [], isLoading, error } = useMarketSnapshots();

  const lastFetched = useMemo(() => {
    if (rows.length === 0) return null;
    const max = rows.reduce((acc, r) => Math.max(acc, new Date(r.fetched_at).getTime()), 0);
    return new Date(max);
  }, [rows]);

  return (
    <div className="container max-w-7xl py-6 md:py-8">
      <header className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">Markets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cross-asset macro snapshot. Sectors, factors, yields, currencies and commodities — all in one terminal view.
          </p>
        </div>
        {lastFetched && (
          <div className="text-[11px] text-muted-foreground font-mono-tabular">
            Last update: {lastFetched.toLocaleTimeString()} · auto-refresh every 15min
          </div>
        )}
      </header>

      {error && (
        <div className="fin-card p-4 mb-4 border-negative/40 text-negative text-sm">
          Failed to load market snapshots.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/40 border border-border h-10 p-1 overflow-x-auto flex w-full md:w-auto">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="text-xs md:text-sm px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Loading market data…
          </div>
        ) : (
          <>
            <TabsContent value="today"><TodayTab rows={rows} /></TabsContent>
            <TabsContent value="sectors"><SectorsTab rows={rows} /></TabsContent>
            <TabsContent value="factors"><FactorsTab rows={rows} /></TabsContent>
            <TabsContent value="yields"><YieldsTab rows={rows} /></TabsContent>
            <TabsContent value="currencies"><CurrenciesTab rows={rows} /></TabsContent>
            <TabsContent value="commodities"><CommoditiesTab rows={rows} /></TabsContent>
            <TabsContent value="countries"><CountriesTab rows={rows} /></TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
};

export default Markets;
