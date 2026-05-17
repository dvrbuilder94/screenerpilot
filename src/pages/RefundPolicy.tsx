import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";

export default function RefundPolicy() {
  return (
    <>
      <Seo title="Refund Policy — ScreenerPilot" description="Refund policy for ScreenerPilot subscriptions." path="/refund-policy" />
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-sm prose-neutral">
          <h1 className="text-3xl font-semibold mb-2">Refund Policy</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: May 17, 2026</p>

          <h2>30-day money-back guarantee</h2>
          <p>
            We offer a <strong>30-day money-back guarantee</strong> on all subscriptions. If you are not satisfied with ScreenerPilot, you may request a full refund within 30 days of your purchase date.
          </p>

          <h2>How to request a refund</h2>
          <p>
            Refunds are processed by our payment provider, <strong>Paddle</strong>, which is the Merchant of Record for all our orders. To request a refund:
          </p>
          <ul>
            <li>Visit <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">paddle.net</a> and look up your transaction with the email you used at checkout, or</li>
            <li>Contact our support through the channels in the Service and we will assist you.</li>
          </ul>

          <h2>Free trial</h2>
          <p>
            New subscribers get a <strong>30-day free trial</strong>. You are not charged during the trial. You can cancel anytime before the trial ends with no charge.
          </p>

          <h2>After 30 days</h2>
          <p>
            Refunds after the 30-day window are considered on a case-by-case basis. You may cancel your subscription anytime to stop future charges — cancellation takes effect at the end of your current billing period.
          </p>

          <div className="mt-12 text-sm">
            <Link to="/" className="underline">← Back home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
