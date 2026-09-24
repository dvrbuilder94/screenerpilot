import { ArrowRight, Bot, Coins, ExternalLink, Network, Rocket, ShieldCheck, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const AGENT_WALLET = "0x4fef4fe834ca4ee2003f08c57d76887ed68e5ecb";

export default function EmergentOS() {
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 sm:py-14">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card px-5 py-10 sm:px-10 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,hsl(var(--primary)/0.12),transparent_34%)]" />
        <div className="relative max-w-4xl">
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge variant="outline">ARC MAINNET</Badge>
            <Badge variant="secondary">$EGENT · GENESIS</Badge>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
            An autonomous economy built to compound.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            emergentOS is an onchain economic system on Arc. Its agent observes markets, allocates capital,
            operates the treasury and grows an ecosystem around $EGENT with every action designed to be verifiable.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/economy">Explore the economy <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/launchpad">Launchpad</Link></Button>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          { icon: Coins, title: "Economy", body: "Treasury, protocol revenue, liquidity, $EGENT activity and capital allocation in one transparent system.", to: "/economy" },
          { icon: Bot, title: "Agent", body: "The agent works for the ecosystem: observe, decide, execute within limits, record and learn.", to: "/agent" },
          { icon: Rocket, title: "Launchpad", body: "Phase one uses Argus infrastructure. The long-term goal is a native emergentOS launch economy.", to: "/launchpad" },
        ].map((item) => (
          <Link key={item.title} to={item.to}>
            <Card className="h-full transition-colors hover:border-foreground/25">
              <CardContent className="p-6">
                <item.icon className="h-5 w-5" />
                <h2 className="mt-5 text-lg font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                <div className="mt-5 flex items-center text-xs font-medium">Open <ArrowRight className="ml-1 h-3.5 w-3.5" /></div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <Card><CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-medium"><Network className="h-4 w-4" />Economic loop</div>
          <div className="mt-7 grid gap-3 sm:grid-cols-5">
            {["Activity", "Fees / revenue", "Treasury", "Agent allocation", "Growth"].map((label, i) => (
              <div key={label} className="relative rounded-xl border border-border bg-background p-4">
                <div className="text-[10px] font-mono text-muted-foreground">0{i + 1}</div>
                <div className="mt-2 text-sm font-medium">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            The objective is to diversify the system over time so emergentOS is not dependent on a single token or revenue source.
          </p>
        </CardContent></Card>

        <Card><CardContent className="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-medium"><Wallet className="h-4 w-4" />Agent wallet</div>
          <div className="mt-5 break-all rounded-xl border border-border bg-background p-4 font-mono text-xs">{AGENT_WALLET}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" />Public address. Private signing material is never exposed.</div>
          <a className="mt-5 inline-flex items-center text-xs font-medium hover:underline" href={"https://testnet.arcscan.app/address/" + AGENT_WALLET} target="_blank" rel="noreferrer">
            Explorer <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </CardContent></Card>
      </section>
    </div>
  );
}
