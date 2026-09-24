import { CircleDollarSign, Coins, Rocket, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function Launchpad() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <div className="mb-3 flex gap-2"><Badge variant="outline">LAUNCHPAD</Badge><Badge variant="secondary">PHASE 1 · ARGUS</Badge></div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Launch an economy, not just a token.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          emergentOS will use Argus as the launch infrastructure first, then layer treasury policy, agent operations and public economic accounting around each launch.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_.72fr]">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Rocket className="h-5 w-5" />Create launch</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><label className="mb-1.5 block text-xs text-muted-foreground">Token name</label><Input placeholder="Emergent" /></div>
            <div><label className="mb-1.5 block text-xs text-muted-foreground">Ticker</label><Input placeholder="EGENT" /></div>
            <div><label className="mb-1.5 block text-xs text-muted-foreground">Short description</label><Input placeholder="An autonomous economy on Arc..." /></div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Balanced", "Liquidity", "Burn"].map((x) => <button key={x} className="rounded-xl border border-border p-4 text-left hover:border-foreground/25"><div className="text-sm font-medium">{x}</div><div className="mt-1 text-[11px] text-muted-foreground">Economic mandate</div></button>)}
            </div>
            <Button className="w-full" disabled>Argus signing integration next</Button>
            <p className="text-center text-[11px] text-muted-foreground">No transaction is created from this V0 screen.</p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card><CardContent className="p-5"><Sparkles className="h-4 w-4"/><div className="mt-3 text-sm font-medium">Autonomous by design</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Each economy can evolve toward an agent-operated mandate rather than stopping after token creation.</p></CardContent></Card>
          <Card><CardContent className="p-5"><CircleDollarSign className="h-4 w-4"/><div className="mt-3 text-sm font-medium">USDC native</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Revenue, reserves and accounting are designed around Arc's dollar-native economy.</p></CardContent></Card>
          <Card><CardContent className="p-5"><ShieldCheck className="h-4 w-4"/><div className="mt-3 text-sm font-medium">Verifiable constraints</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Agent permissions and economic limits should be explicit and observable rather than hidden behind AI.</p></CardContent></Card>
          <Card><CardContent className="p-5"><Coins className="h-4 w-4"/><div className="mt-3 text-sm font-medium">$EGENT first</div><p className="mt-1 text-xs leading-5 text-muted-foreground">$EGENT is the genesis economy and the proof-of-concept for the system.</p></CardContent></Card>
        </div>
      </div>
    </div>
  );
}
