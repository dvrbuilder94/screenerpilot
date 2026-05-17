import { Seo } from "@/components/Seo";
import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <>
      <Seo title="Privacy Notice — ScreenerPilot" description="Privacy notice for ScreenerPilot." path="/privacy" />
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-3xl mx-auto prose prose-sm prose-neutral">
          <h1 className="text-3xl font-semibold mb-2">Privacy Notice</h1>
          <p className="text-xs text-muted-foreground mb-8">Last updated: May 17, 2026</p>

          <p>This Notice explains how ScreenerPilot, operated by <strong>Diego Vasquez Riesco</strong> (sole proprietor trading as ScreenerPilot), collects and uses personal data. Diego Vasquez Riesco is the <strong>data controller</strong> for the personal data described here.</p>

          <h2>1. Data we collect</h2>
          <ul>
            <li><strong>Account data</strong> — email, display name, password hash.</li>
            <li><strong>Usage data</strong> — pages viewed, features used, watchlist contents, AlexIA prompts, timestamps.</li>
            <li><strong>Technical data</strong> — IP address, device, browser, language, error logs.</li>
            <li><strong>Support data</strong> — messages you send us.</li>
            <li><strong>Billing data</strong> — collected and processed by Paddle (see Section 4). We receive only metadata (subscription status, plan, period).</li>
          </ul>

          <h2>2. Purposes & legal bases</h2>
          <ul>
            <li>Provide and operate the Service — contract performance.</li>
            <li>Security, fraud prevention, abuse detection — legitimate interests.</li>
            <li>Customer support — contract performance.</li>
            <li>Product improvement and analytics — legitimate interests.</li>
            <li>Legal obligations (e.g. accounting, tax records) — legal obligation.</li>
          </ul>

          <h2>3. Retention</h2>
          <p>We retain account and usage data while your account is active and for a reasonable period afterwards to handle disputes, comply with law, and prevent fraud. Data is deleted or anonymised when no longer needed.</p>

          <h2>4. Sharing</h2>
          <ul>
            <li><strong>Paddle.com</strong> — our Merchant of Record. Handles checkout, billing, tax compliance, invoicing, refunds and chargebacks. See Paddle's privacy notice for how they process your data.</li>
            <li><strong>Hosting & infrastructure providers</strong> — Supabase / Cloudflare-class providers that host our backend, database and edge functions.</li>
            <li><strong>Market data providers</strong> — we fetch market data from third parties (Binance, Yahoo Finance, FRED, news APIs). They do not receive your personal data.</li>
            <li><strong>AI providers</strong> — prompts you send to AlexIA are processed by an AI gateway in order to generate responses.</li>
            <li><strong>Authorities</strong> — where required by law.</li>
            <li><strong>Professional advisers</strong> — legal, accounting.</li>
          </ul>

          <h2>5. International transfers</h2>
          <p>Personal data may be processed outside your country. Where required, we rely on standard contractual clauses or adequacy decisions.</p>

          <h2>6. Your rights</h2>
          <p>Subject to local law, you may have rights to access, rectify, erase, restrict, port or object to processing of your personal data, and to withdraw consent. You may also lodge a complaint with your supervisory authority. To exercise rights, contact us through the support channels in the Service.</p>

          <h2>7. Security</h2>
          <p>We use industry-standard technical and organisational measures, including encryption in transit, hashed passwords, row-level security in our database, and access controls.</p>

          <h2>8. Cookies</h2>
          <p>We use essential cookies and local storage to keep you signed in and to remember your preferences. We do not use third-party advertising cookies.</p>

          <h2>9. Changes</h2>
          <p>We may update this Notice; the "Last updated" date will reflect changes.</p>

          <div className="mt-12 text-sm">
            <Link to="/" className="underline">← Back home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
