import { Bot, Coins, Database, Droplets, GitBranch, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const metrics = [
  ["Treasury", "—", "Live accounting not connected yet"],
  ["External revenue", "—", "USDC earned outside $EGENT trading"],
  ["$EGENT bought", "—", "Agent / protocol buybacks"],
  ["$EGENT burned", "—", "Verified onchain only"],
  ["Liquidity", "—", "Market depth tracked separately"],
  ["Holder rewards", "—", "Onchain distributions"],
];

export default function Economy() {
  return (
    <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-8 sm:px-6">
      <div>
        <div className="mb-3 flex gap-2"><Badge variant="outline">ECONOMY</Badge><Badge variant="secondary">GENESIS</Badge></div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The emergentOS economy</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          A transparent capital system designed to evolve from token activity into multiple independent USDC revenue streams.
          Metrics remain blank until they are connected to verifiable sources.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map(([name, value, note]) => (
          <Card key={name}><CardContent className="p-5">
            <div className="text-xs text-muted-foreground">{name}</div>
            <div className="mt-2 font-mono text-2xl font-semibold">{value}</div>
            <div className="mt-2 text-xs text-muted-foreground">{note}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitBranch className="h-4 w-4" />Capital flywheel</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["1", "Users + agents", "Generate economic activity."],
              ["2", "USDC revenue", "External revenue enters the system."],
              ["3", "Treasury", "Capital is accounted for onchain."],
              ["4", "Agent", "Allocates inside predefined limits."],
              ["5", "Reinvestment", "Product, liquidity, reserve and $EGENT economy."],
            ].map(([n,t,d]) => <div key={n} className="flex gap-3 rounded-xl border border-border p-4"><span className="font-mono text-xs text-muted-foreground">{n}</span><div><div className="font-medium">{t}</div><div className="mt-1 text-xs text-muted-foreground">{d}</div></div></div>)}
          </CardContent>
        </Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Coins className="h-4 w-4" />Economic layers</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              [Droplets, "Market", "Argus + Arc liquidity infrastructure."],
              [WalletCards, "Treasury", "USDC reserves and transparent accounting."],
              [Bot, "Agent", "Rules-based capital allocation and execution."],
              [Database, "Products", "Future services create non-token revenue."],
            ].map(([Icon,title,body]: any) => <div key={title} className="rounded-xl border border-border p-4"><Icon className="h-4 w-4"/><div className="mt-3 text-sm font-medium">{title}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p></div>)}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
