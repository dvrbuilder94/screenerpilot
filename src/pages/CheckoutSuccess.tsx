import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

export default function CheckoutSuccess() {
  return (
    <>
      <Seo title="Welcome to Pro — ScreenerPilot" description="Your trial is active." path="/checkout/success" />
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-bullish/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-7 h-7 text-bullish" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-3">You're in.</h1>
          <p className="text-muted-foreground mb-8">
            Your 30-day trial just started. Full terminal access is unlocked.
          </p>
          <Button asChild size="lg" className="w-full">
            <Link to="/markets">Open terminal</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            It may take a few seconds for your subscription to appear.
          </p>
        </div>
      </div>
    </>
  );
}
