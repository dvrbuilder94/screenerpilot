import { FormEvent, useState } from "react";
import { Wallet, Search, Loader2, ArrowDownToLine, ArrowUpFromLine, CircleDollarSign, TrendingUp, AlertTriangle, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Movement = {
  hash: string;
  timestamp: string;
  chain: string;
  symbol: string;
  amount: number;
  usdValue: number | null;
  direction: "in" | "out";
  classification: string;
  confidence: "high" | "medium" | "low";
  explorerUrl: string;
};

type Holding = {
  chain: string;
  symbol: string;
  name: string;
  amount: number;
  priceUsd: number | null;
  valueUsd: number | null;
};

type WalletAnalysis = {
  wallet: string;
  generatedAt: string;
  summary: {
    portfolioValueUsd: number;
    netDepositsUsd: number;
    depositsUsd: number;
    withdrawalsUsd: number;
    pnlUsd: number;
    roiPct: number | null;
    pricedCoveragePct: number;
  };
  chains: string[];
  holdings: Holding[];
  movements: Movement[];
  warnings: string[];
};

const DEFAULT_WALLET = "0x774c8240715b317b30de07b837ade2e95cd59f26";
const isEvmAddress = (value: string) => /^0x[a-fA-F0-9]{40}$/.test(value.trim());
const usd = (value: number | null) => value == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const number = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);

export default function WalletAnalyzer() {
  const [wallet, setWallet] = useState(DEFAULT_WALLET);
  const [analysis, setAnalysis] = useState<WalletAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze(event: FormEvent) {
    event.preventDefault();
    const address = wallet.trim();
    if (!isEvmAddress(address)) {
      setError("Enter a valid EVM wallet address (0x followed by 40 hexadecimal characters).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: functionError } = await supabase.functions.invoke("wallet-pnl", { body: { wallet: address } });
      if (functionError) throw functionError;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data as WalletAnalysis);
    } catch (err) {
      setAnalysis(null);
      setError(err instanceof Error ? err.message : "Wallet analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  const cards = analysis ? [
    { label: "Portfolio value", value: usd(analysis.summary.portfolioValueUsd), icon: Wallet },
    { label: "Net invested", value: usd(analysis.summary.netDepositsUsd), icon: CircleDollarSign },
    { label: "Total PnL", value: usd(analysis.summary.pnlUsd), icon: TrendingUp },
    { label: "ROI", value: analysis.summary.roiPct == null ? "—" : `${analysis.summary.roiPct.toFixed(2)}%`, icon: TrendingUp },
  ] : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <Badge variant="secondary" className="mb-3">On-chain analytics</Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Wallet PnL Analyzer</h1>
        <p className="mt-3 text-muted-foreground">Paste one EVM address. ScreenerPilot finds supported networks, separates deposits and withdrawals, and estimates your portfolio PnL automatically.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={analyze} className="flex flex-col gap-3 sm:flex-row">
            <Input value={wallet} onChange={(e) => setWallet(e.target.value)} placeholder="0x..." className="h-12 font-mono" spellCheck={false} />
            <Button type="submit" size="lg" disabled={loading} className="h-12 min-w-36">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? "Analyzing" : "Analyze"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && <Alert variant="destructive" className="mb-6"><AlertTriangle className="h-4 w-4" /><AlertTitle>Could not analyze wallet</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      {analysis && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map(({ label, value, icon: Icon }) => (
              <Card key={label}><CardContent className="flex items-start justify-between pt-6"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><Icon className="h-5 w-5 text-muted-foreground" /></CardContent></Card>
            ))}
          </div>

          {analysis.warnings.length > 0 && <Alert className="mb-6"><AlertTriangle className="h-4 w-4" /><AlertTitle>Estimate quality: {analysis.summary.pricedCoveragePct.toFixed(0)}% priced</AlertTitle><AlertDescription>{analysis.warnings.join(" ")}</AlertDescription></Alert>}

          <Tabs defaultValue="holdings">
            <TabsList><TabsTrigger value="holdings">Holdings</TabsTrigger><TabsTrigger value="movements">Cash flows</TabsTrigger></TabsList>
            <TabsContent value="holdings" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Current holdings</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-sm">
                    <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3">Asset</th><th className="pb-3">Chain</th><th className="pb-3 text-right">Amount</th><th className="pb-3 text-right">Price</th><th className="pb-3 text-right">Value</th></tr></thead>
                    <tbody>{analysis.holdings.map((h, i) => <tr key={`${h.chain}-${h.symbol}-${i}`} className="border-b last:border-0"><td className="py-4"><div className="font-medium">{h.symbol}</div><div className="text-xs text-muted-foreground">{h.name}</div></td><td className="py-4">{h.chain}</td><td className="py-4 text-right font-mono">{number(h.amount)}</td><td className="py-4 text-right">{usd(h.priceUsd)}</td><td className="py-4 text-right font-medium">{usd(h.valueUsd)}</td></tr>)}</tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="movements" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Detected movements</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full min-w-[840px] text-sm">
                    <thead><tr className="border-b text-left text-muted-foreground"><th className="pb-3">Date</th><th className="pb-3">Type</th><th className="pb-3">Asset</th><th className="pb-3">Chain</th><th className="pb-3 text-right">Amount</th><th className="pb-3 text-right">USD</th><th className="pb-3"></th></tr></thead>
                    <tbody>{analysis.movements.map((m) => <tr key={`${m.chain}-${m.hash}-${m.symbol}-${m.direction}`} className="border-b last:border-0"><td className="py-4">{new Date(m.timestamp).toLocaleDateString()}</td><td className="py-4"><Badge variant="outline" className="gap-1">{m.direction === "in" ? <ArrowDownToLine className="h-3 w-3" /> : <ArrowUpFromLine className="h-3 w-3" />}{m.classification}</Badge></td><td className="py-4 font-medium">{m.symbol}</td><td className="py-4">{m.chain}</td><td className="py-4 text-right font-mono">{number(m.amount)}</td><td className="py-4 text-right">{usd(m.usdValue)}</td><td className="py-4 text-right"><a href={m.explorerUrl} target="_blank" rel="noreferrer" aria-label="Open transaction"><ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" /></a></td></tr>)}</tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
