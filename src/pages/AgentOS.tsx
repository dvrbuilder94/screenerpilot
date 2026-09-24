import { Activity, Bot, CheckCircle2, LockKeyhole, Shield, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AGENT_WALLET = "0x4fef4fe834ca4ee2003f08c57d76887ed68e5ecb";

export default function AgentOS() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 sm:px-6">
      <div>
        <div className="mb-3 flex gap-2"><Badge variant="outline">AGENT</Badge><Badge variant="secondary">CONTROLLED EXECUTION</Badge></div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">The agent works for the economy.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          emergentOS is designed so intelligence proposes actions while hard rules constrain what can actually move onchain.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          [Bot, "Observe", "Read market, liquidity, treasury and protocol state."],
          [Activity, "Decide", "Choose among explicitly allowed actions and explain why."],
          [CheckCircle2, "Verify", "Publish the resulting transaction and update economic state."],
        ].map(([Icon,title,body]: any) => <Card key={title}><CardContent className="p-5"><Icon className="h-5 w-5"/><div className="mt-4 font-medium">{title}</div><p className="mt-2 text-xs leading-5 text-muted-foreground">{body}</p></CardContent></Card>)}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4"/>Agent wallet</CardTitle></CardHeader>
          <CardContent>
            <div className="break-all rounded-xl border border-border bg-background p-4 font-mono text-xs">{AGENT_WALLET}</div>
            <p className="mt-3 text-xs text-muted-foreground">Public identifier for the emergentOS agent. Signing credentials are not stored in the public app.</p>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4"/>Execution policy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Spending limits before autonomous execution", "Approved venues / contracts only", "No unrestricted treasury key in the frontend", "Every economic action must be attributable"].map((x) =>
              <div key={x} className="flex gap-2 text-sm"><LockKeyhole className="mt-0.5 h-4 w-4 text-muted-foreground"/><span>{x}</span></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
