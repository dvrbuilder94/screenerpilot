import { useState } from "react";
import { Check, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { Seo } from "@/components/Seo";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

export default function Pricing() {
  const { user } = useAuth();
  const { isActive } = useSubscription();
  const { openCheckout, loading } = usePaddleCheckout();
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/signup");
      return;
    }
    await openCheckout({
      priceId: billing === "monthly" ? "pro_monthly" : "pro_yearly",
      customerEmail: user.email,
      customData: { userId: user.id },
      successUrl: `${window.location.origin}/checkout/success`,
    });
  };

  const features = [
    "Full Markets terminal (stocks, crypto, indices, commodities)",
    "Macro intelligence: regimes, ratios, dislocations",
    "Stock Intelligence with on-demand analysis",
    "BEN macro copilot — unlimited messages",
    "Real-time data from Binance & Yahoo Finance",
    "Email support",
  ];

  return (
    <>
      <Seo
        title="Pricing — ScreenerPilot Pro"
        description="ScreenerPilot Pro: $15/month or $144/year. 30-day free trial. Cancel anytime."
        path="/pricing"
      />
      <PaymentTestModeBanner />
      <div className="min-h-screen bg-background py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
              One plan. Full terminal.
            </h1>
            <p className="text-lg text-muted-foreground">
              30 days free. Cancel anytime — no questions.
            </p>
          </div>

          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex bg-secondary rounded-full p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  billing === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  billing === "yearly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                Yearly <span className="ml-1 text-xs text-bullish">−20%</span>
              </button>
            </div>
          </div>

          <Card className="p-10 border-2 border-foreground/10 shadow-elegant max-w-xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground font-medium">
                ScreenerPilot Pro
              </span>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-5xl font-semibold text-foreground">
                ${billing === "monthly" ? "15" : "12"}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {billing === "monthly"
                ? "Billed monthly. 30-day free trial."
                : "$144 billed yearly. 30-day free trial."}
            </p>

            <ul className="space-y-3 mb-8">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-bullish mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            {isActive ? (
              <Button asChild size="lg" className="w-full" variant="outline">
                <Link to="/markets">Go to terminal</Link>
              </Button>
            ) : (
              <Button onClick={handleSubscribe} size="lg" className="w-full" disabled={loading}>
                {loading ? "Opening checkout…" : user ? "Start 30-day free trial" : "Sign up & start free trial"}
              </Button>
            )}

            <p className="text-[11px] text-muted-foreground text-center mt-4">
              Payment processed by Paddle. You won't be charged for 30 days. Cancel anytime before then.
            </p>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Questions? See our{" "}
            <Link to="/refund-policy" className="underline">refund policy</Link>{" "}
            and{" "}
            <Link to="/terms" className="underline">terms</Link>.
          </p>
        </div>
      </div>
    </>
  );
}
