import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <>
      <Seo title="Terms & Conditions — ScreenerPilot" description="Terms of service for ScreenerPilot." path="/terms" />
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-sm prose-neutral">
          <h1 className="text-3xl font-semibold mb-2">Terms & Conditions</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: May 17, 2026</p>

          <p>These Terms govern your use of ScreenerPilot ("the Service", "we", "us", "our"). By accessing or using the Service you agree to these Terms.</p>

          <h2>1. The Service</h2>
          <p>ScreenerPilot is a <strong>read-only macro intelligence terminal</strong> for monitoring market regimes, ratios, dislocations and macro indicators across crypto, equities, commodities, and indices. The Service does not execute trades and does not provide personalized financial, investment, legal or tax advice.</p>

          <h2>2. No Advice — Information Only</h2>
          <p>All information, data, scores, regimes, signals, indicators, ratios and AI-generated commentary are provided for <strong>general informational and educational purposes only</strong>. Nothing on the Service constitutes financial, investment, legal, accounting or tax advice, nor a recommendation to buy, sell or hold any asset. You are solely responsible for your decisions and any losses arising from them. Past performance does not guarantee future results.</p>

          <h2>3. Account & Acceptance</h2>
          <p>You must be of legal age in your jurisdiction. You are responsible for the confidentiality of your credentials and for all activity under your account. You agree to provide accurate information and keep it up to date.</p>

          <h2>4. Acceptable Use</h2>
          <p>You will not: (a) use the Service unlawfully or fraudulently; (b) infringe third-party IP rights; (c) interfere with security (malware, probing, scraping at scale, bypassing rate limits); (d) resell, redistribute or reverse-engineer the Service; (e) use the Service to spam or to generate financial advice for others.</p>

          <h2>5. AI Features</h2>
          <p>The Service includes AI-generated outputs (e.g. BEN copilot, macro insights). Outputs may be inaccurate, incomplete or outdated. You are responsible for your prompts, your interpretation of outputs, and for verifying accuracy before acting. AI outputs are not professional advice.</p>

          <h2>6. IP & Licence</h2>
          <p>We retain all rights to the Service, including software, branding and content we produce. We grant you a limited, non-exclusive, non-transferable right to access and use the Service within your subscribed plan.</p>

          <h2>7. Subscriptions, Payment & Tax</h2>
          <p>Subscriptions auto-renew at the end of each billing period until canceled. Our order process is conducted by our online reseller <strong>Paddle.com</strong>. <strong>Paddle.com is the Merchant of Record for all our orders.</strong> Paddle provides all billing-related customer service inquiries, handles tax collection where applicable, and processes refunds. For payment, billing, tax, cancellation and refund mechanics, see Paddle's <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noopener noreferrer">Buyer Terms</a>.</p>

          <h2>8. Free Trial</h2>
          <p>Free trials require a valid payment method at signup. If you do not cancel before the trial ends, you will be charged the then-current price for your selected plan.</p>

          <h2>9. Service Level</h2>
          <p>The Service is provided "as is" and "as available". We do not warrant uninterrupted or error-free operation, accuracy of market data (which is sourced from third parties such as Binance and Yahoo Finance), or fitness for a particular purpose, to the fullest extent permitted by law.</p>

          <h2>10. Suspension & Termination</h2>
          <p>We may suspend or terminate access for material breach, non-payment, security or fraud risk, or repeated policy violations. You may cancel anytime via the customer portal.</p>

          <h2>11. Limitation of Liability</h2>
          <p>To the fullest extent permitted by law, our aggregate liability is limited to the fees you paid in the 12 months preceding the claim. We exclude liability for indirect, consequential, special or incidental damages (loss of profits, data, trading losses, goodwill). Nothing limits liability for fraud, death or personal injury where prohibited by law.</p>

          <h2>12. Governing Law</h2>
          <p>These Terms are governed by the laws of the seller's jurisdiction. Disputes will be resolved by the competent courts of that jurisdiction.</p>

          <h2>13. Changes</h2>
          <p>We may update these Terms; continued use after changes constitutes acceptance.</p>

          <h2>14. Contact</h2>
          <p>Questions: contact us through the support channels in the Service.</p>

          <div className="mt-12 text-sm">
            <Link to="/" className="underline">← Back home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
