import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { atr, bollingerBands, ema, macd, rsi } from "@/lib/indicators";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, Gauge, Search, ShieldCheck, Target, TrendingUp, Zap } from "lucide-react";

const ROBINHOOD_UNIVERSE = [
  "NVDA","AAPL","MSFT","AMZN","META","GOOGL","TSLA","AMD","AVGO","MU","MRVL","PLTR",
  "CRWD","SNOW","ORCL","NFLX","HOOD","COIN","RIVN","SOFI","SHOP","UBER","ABNB","ARM",
  "SMCI","INTC","QCOM","TSM","SPY","QQQ","IWM","DIA","GLD","SLV","TLT","XLE","XLK","XLF"
];

type Candle = { openTime:number; open:number; high:number; low:number; close:number; volume:number; closeTime:number };

type Setup = {
  symbol:string; price:number; change:number; rsi:number; trend:"Uptrend"|"Downtrend"|"Mixed"; momentum:"Improving"|"Weakening"|"Neutral";
  score:number; setup:"Oversold bounce"|"Trend continuation"|"Breakout watch"|"No edge";
  entryLow:number; entryHigh:number; stop:number; target:number; rr:number; relVolume:number; distance200:number;
};

function pct(v:number){ return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`; }
function money(v:number){ return `$${v.toFixed(v >= 100 ? 2 : 3)}`; }
function last<T>(arr:T[]){ return arr[arr.length-1]; }

function buildSetup(symbol:string, candles:Candle[]):Setup | null {
  if (!candles || candles.length < 220) return null;
  const closes = candles.map(c=>c.close);
  const volumes = candles.map(c=>c.volume || 0);
  const price = last(closes);
  const prev = closes[closes.length-2];
  const change = ((price/prev)-1)*100;
  const rsi14 = last(rsi(closes,14));
  const ema20 = last(ema(closes,20));
  const ema50 = last(ema(closes,50));
  const ema200 = last(ema(closes,200));
  const macdData = macd(closes);
  const hist = last(macdData.histogram);
  const histPrev = macdData.histogram[macdData.histogram.length-2];
  const bb = last(bollingerBands(closes,20,2));
  const atr14 = last(atr(candles,14));
  const avgVol20 = volumes.slice(-21,-1).reduce((a,b)=>a+b,0)/20;
  const relVolume = avgVol20 > 0 ? last(volumes)/avgVol20 : 1;
  const high20 = Math.max(...candles.slice(-21,-1).map(c=>c.high));
  const distance200 = ((price/ema200)-1)*100;

  const trend = price > ema50 && ema20 > ema50 && ema50 > ema200 ? "Uptrend" : price < ema50 && ema20 < ema50 ? "Downtrend" : "Mixed";
  const momentum = hist > histPrev ? "Improving" : hist < histPrev ? "Weakening" : "Neutral";

  const oversold = rsi14 <= 35 && price <= bb.middle && distance200 > -18;
  const continuation = trend === "Uptrend" && rsi14 >= 42 && rsi14 <= 62 && hist > 0;
  const breakout = price >= high20*0.985 && relVolume >= 1.15 && price > ema50;

  let score = 35;
  if (trend === "Uptrend") score += 18;
  if (price > ema200) score += 8;
  if (momentum === "Improving") score += 10;
  if (rsi14 >= 42 && rsi14 <= 62) score += 8;
  if (rsi14 <= 35) score += 10;
  if (relVolume >= 1.2) score += 7;
  if (breakout) score += 8;
  if (trend === "Downtrend") score -= 18;
  if (rsi14 > 75) score -= 12;
  score = Math.max(0,Math.min(100,Math.round(score)));

  const setup = oversold ? "Oversold bounce" : breakout ? "Breakout watch" : continuation ? "Trend continuation" : "No edge";
  const entryLow = oversold ? Math.max(bb.lower, price-0.35*atr14) : Math.max(ema20, price-0.25*atr14);
  const entryHigh = price+0.12*atr14;
  const stop = Math.min(entryLow-1.05*atr14, ema50-0.35*atr14);
  const risk = Math.max(0.01, ((entryLow+entryHigh)/2)-stop);
  const target = ((entryLow+entryHigh)/2)+2.2*risk;
  const rr = (target-((entryLow+entryHigh)/2))/risk;

  return {symbol,price,change,rsi:rsi14,trend,momentum,score,setup,entryLow,entryHigh,stop,target,rr,relVolume,distance200};
}

async function fetchDaily(symbol:string):Promise<Candle[]> {
  const { data, error } = await supabase.functions.invoke("fetch-stock-data", { body:{symbol,interval:"1d"} });
  if (error) throw error;
  return data?.candles ?? [];
}

export default function RobinhoodSetups(){
  const [tab,setTab]=useState("all");
  const [search,setSearch]=useState("");
  const queries = useQueries({
    queries: ROBINHOOD_UNIVERSE.map(symbol=>({
      queryKey:["rh-setup",symbol], queryFn:()=>fetchDaily(symbol), staleTime:5*60*1000, retry:1
    }))
  });

  const setups = useMemo(()=>{
    return queries.map((q,i)=> q.data ? buildSetup(ROBINHOOD_UNIVERSE[i],q.data) : null)
      .filter(Boolean) as Setup[];
  },[queries]);

  const filtered = setups.filter(s=>{
    const match = s.symbol.includes(search.trim().toUpperCase());
    if (!match) return false;
    if (tab === "oversold") return s.setup === "Oversold bounce";
    if (tab === "trend") return s.trend === "Uptrend" && s.setup !== "No edge";
    if (tab === "breakout") return s.setup === "Breakout watch";
    if (tab === "momentum") return s.momentum === "Improving" && s.score >= 60;
    return s.setup !== "No edge" || s.score >= 55;
  }).sort((a,b)=>b.score-a.score);

  const loading = queries.some(q=>q.isLoading);
  const best = filtered[0];

  return <div className="max-w-[1500px] mx-auto p-4 sm:p-6 space-y-5">
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-2"><Badge variant="outline">Robinhood-focused</Badge><Badge variant="secondary">Daily setups</Badge></div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Robinhood Setups</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">Busca entradas con confluencia de tendencia, momentum, sobreventa, volumen y riesgo. El objetivo no es adivinar el precio: es filtrar setups donde la invalidación sea clara.</p>
      </div>
      <div className="relative w-full lg:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ticker…" className="pl-9"/></div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Universe</div><div className="text-2xl font-semibold mt-1">{ROBINHOOD_UNIVERSE.length}</div><div className="text-xs text-muted-foreground mt-1">liquid US names + ETFs</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Actionable now</div><div className="text-2xl font-semibold mt-1">{filtered.filter(x=>x.score>=65).length}</div><div className="text-xs text-muted-foreground mt-1">score ≥ 65</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Oversold</div><div className="text-2xl font-semibold mt-1">{setups.filter(x=>x.setup==="Oversold bounce").length}</div><div className="text-xs text-muted-foreground mt-1">RSI + structure filter</div></CardContent></Card>
      <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Best setup</div><div className="text-2xl font-semibold mt-1">{best?.symbol ?? "—"}</div><div className="text-xs text-muted-foreground mt-1">{best ? `${best.score}/100 · ${best.setup}` : loading ? "scanning…" : "no edge"}</div></CardContent></Card>
    </div>

    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex">
        <TabsTrigger value="all">Best</TabsTrigger><TabsTrigger value="oversold">Oversold</TabsTrigger><TabsTrigger value="trend">Trend</TabsTrigger><TabsTrigger value="momentum">Momentum</TabsTrigger><TabsTrigger value="breakout">Breakout</TabsTrigger>
      </TabsList>
    </Tabs>

    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Gauge className="h-4 w-4"/> Ranked opportunities</CardTitle></CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full min-w-[1050px] text-sm">
          <thead className="border-y border-border bg-muted/30 text-xs text-muted-foreground"><tr>
            <th className="text-left px-4 py-3">Asset</th><th className="text-left px-3">Setup</th><th className="text-right px-3">Score</th><th className="text-right px-3">RSI</th><th className="text-left px-3">Trend</th><th className="text-left px-3">Momentum</th><th className="text-right px-3">Rel Vol</th><th className="text-right px-3">Entry zone</th><th className="text-right px-3">Stop</th><th className="text-right px-3">Target</th><th className="text-right px-4">R:R</th>
          </tr></thead>
          <tbody>{filtered.map(s=><tr key={s.symbol} className="border-b border-border/70 hover:bg-muted/20">
            <td className="px-4 py-3"><Link to={`/asset/${s.symbol}`} className="font-semibold hover:underline">{s.symbol}</Link><div className="text-xs text-muted-foreground flex items-center gap-1">{money(s.price)} <span className={s.change>=0?"text-emerald-500":"text-red-500"}>{s.change>=0?<ArrowUp className="inline h-3 w-3"/>:<ArrowDown className="inline h-3 w-3"/>}{pct(s.change)}</span></div></td>
            <td className="px-3"><Badge variant={s.setup==="No edge"?"outline":"secondary"}>{s.setup}</Badge></td>
            <td className="text-right px-3"><span className={`font-semibold ${s.score>=75?"text-emerald-500":s.score>=60?"text-foreground":"text-muted-foreground"}`}>{s.score}</span></td>
            <td className="text-right px-3">{s.rsi.toFixed(1)}</td><td className="px-3">{s.trend}</td><td className="px-3">{s.momentum}</td><td className="text-right px-3">{s.relVolume.toFixed(2)}x</td>
            <td className="text-right px-3 font-medium">{money(s.entryLow)}–{money(s.entryHigh)}</td><td className="text-right px-3 text-red-500">{money(s.stop)}</td><td className="text-right px-3 text-emerald-500">{money(s.target)}</td><td className="text-right px-4 font-semibold">{s.rr.toFixed(1)}</td>
          </tr>)}</tbody>
        </table>
        {!loading && filtered.length===0 && <div className="p-10 text-center text-sm text-muted-foreground">No setups match this filter right now.</div>}
        {loading && setups.length===0 && <div className="p-10 text-center text-sm text-muted-foreground">Scanning Robinhood universe…</div>}
      </CardContent>
    </Card>

    <div className="grid lg:grid-cols-3 gap-3">
      <Card><CardContent className="p-4"><div className="flex items-center gap-2 font-medium"><TrendingUp className="h-4 w-4"/>Trend regime</div><p className="text-xs text-muted-foreground mt-2">Favorece continuidad cuando precio &gt; EMA50, EMA20 &gt; EMA50 y EMA50 &gt; EMA200. Evita tratar cada caída como oportunidad.</p></CardContent></Card>
      <Card><CardContent className="p-4"><div className="flex items-center gap-2 font-medium"><Zap className="h-4 w-4"/>Momentum confirmation</div><p className="text-xs text-muted-foreground mt-2">RSI se usa como contexto, no como gatillo aislado. Se combina con MACD histogram, Bollinger location y volumen relativo.</p></CardContent></Card>
      <Card><CardContent className="p-4"><div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4"/>Risk first</div><p className="text-xs text-muted-foreground mt-2">Cada idea muestra zona de entrada, invalidación basada en ATR/EMA y target 2.2R. Si el stop no tiene sentido, el setup tampoco.</p></CardContent></Card>
    </div>

    <Card><CardContent className="p-4 text-xs text-muted-foreground"><div className="flex items-center gap-2 text-foreground font-medium mb-2"><Target className="h-4 w-4"/>How to read the score</div>75–100 = strong confluence; 60–74 = watchlist/confirmation; below 60 = weak edge. This is a research screener, not investment advice. Validate liquidity, news/catalysts and position sizing before trading.</CardContent></Card>
  </div>
}
