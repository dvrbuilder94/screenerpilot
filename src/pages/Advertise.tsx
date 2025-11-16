import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Advertise() {
  const [formData, setFormData] = useState({
    projectName: "",
    websiteUrl: "",
    email: "",
    projectDescription: "",
    placementType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.projectName || !formData.websiteUrl || !formData.email || 
        !formData.projectDescription || !formData.placementType || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("send-advertiser-email", {
        body: formData,
      });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setFormData({
        projectName: "",
        websiteUrl: "",
        email: "",
        projectDescription: "",
        placementType: "",
        message: "",
      });
    } catch (error) {
      console.error("Error sending email:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Advertise With ScreenerPilot
          </h1>
          <p className="text-lg text-gray-600">
            Reach crypto traders, analysts, and Web3 enthusiasts through strategic advertising placements
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Introduction */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Introduction
          </h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              ScreenerPilot offers advertising opportunities for crypto, trading, analytics, and Web3-related projects.
              Our platform is designed to connect legitimate tools, dashboards, exchanges, data providers, and token
              projects with a highly engaged audience of traders and crypto enthusiasts.
            </p>
            <p>
              We provide flexible promotional placements across our platform, ensuring your project reaches the right
              audience at the right time.
            </p>
          </div>
        </section>

        <Separator className="my-12 bg-gray-200" />

        {/* What We Offer */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What We Offer
          </h2>
          <div className="text-gray-700 space-y-6">
            <p className="leading-relaxed">
              We provide various advertising formats to suit different promotional needs:
            </p>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">Banner placements</strong> within the interface</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">Sponsored sections</strong> inside analytics modules</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">Chain-specific promotional placements</strong></span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">Custom promotional integrations</strong> depending on fit and review</span>
              </li>
            </ul>
          </div>
        </section>

        <Separator className="my-12 bg-gray-200" />

        {/* Requirements & Restrictions */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Requirements & Restrictions
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
            <p className="text-gray-700 leading-relaxed">
              All advertisers must pass a <strong className="text-gray-900">manual review</strong>. We maintain strict
              standards to protect our users and platform integrity.
            </p>
            <div>
              <p className="text-gray-900 font-semibold mb-3">We do not accept:</p>
              <ul className="space-y-2 ml-6 text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">×</span>
                  <span>Scams or high-risk financial schemes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">×</span>
                  <span>Honeypots or malicious smart contracts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">×</span>
                  <span>Casino/gambling platforms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">×</span>
                  <span>Projects without documentation or transparency</span>
                </li>
              </ul>
            </div>
            <p className="text-gray-700 text-sm italic">
              ScreenerPilot reserves the right to decline any project at any time.
            </p>
          </div>
        </section>

        <Separator className="my-12 bg-gray-200" />

        {/* Manual Review Process */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Manual Review Process
          </h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              Each project submission undergoes a thorough manual review process. Our team evaluates:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span>Documentation quality and completeness</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span>Project legitimacy and team transparency</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span>Smart contract safety (if applicable)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span>Overall alignment with our platform values</span>
              </li>
            </ul>
            <p className="text-sm italic">
              Please note: Approval is not guaranteed, and advertisements may be removed if a project violates our terms
              or standards.
            </p>
          </div>
        </section>

        <Separator className="my-12 bg-gray-200" />

        {/* Payment & Terms */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Payment & Terms
          </h2>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              We accept payments in the following cryptocurrencies:
            </p>
            <ul className="space-y-2 ml-6">
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">USDT</strong> (Tether)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">USDC</strong> (USD Coin)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">ETH</strong> (Ethereum)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">SOL</strong> (Solana)</span>
              </li>
              <li className="flex items-start">
                <span className="text-gray-900 mr-2">•</span>
                <span><strong className="text-gray-900">BTC Lightning</strong></span>
              </li>
            </ul>
            <p className="text-sm">
              Specific pricing and terms are shared individually after the review process is completed. No KYC is
              required from advertisers, but we may request additional information if necessary for verification
              purposes.
            </p>
          </div>
        </section>

        <Separator className="my-12 bg-gray-200" />

        {/* Contact Form */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Get Started
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
            <p className="text-gray-700 mb-6 leading-relaxed">
              Interested in advertising with ScreenerPilot? Fill out the form below and our team will review your
              submission and get back to you shortly.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="projectName" className="text-gray-900">
                  Project Name *
                </Label>
                <Input
                  id="projectName"
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="mt-1.5 bg-white border-gray-300 text-gray-900"
                  placeholder="Enter your project name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl" className="text-gray-900">
                  Website URL *
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="mt-1.5 bg-white border-gray-300 text-gray-900"
                  placeholder="https://yourproject.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-900">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1.5 bg-white border-gray-300 text-gray-900"
                  placeholder="contact@yourproject.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="projectDescription" className="text-gray-900">
                  Project Description *
                </Label>
                <Textarea
                  id="projectDescription"
                  value={formData.projectDescription}
                  onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                  className="mt-1.5 bg-white border-gray-300 text-gray-900 min-h-[100px]"
                  placeholder="Tell us about your project..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="placementType" className="text-gray-900">
                  Type of Placement *
                </Label>
                <Select
                  value={formData.placementType}
                  onValueChange={(value) => setFormData({ ...formData, placementType: value })}
                  required
                >
                  <SelectTrigger className="mt-1.5 bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select placement type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="sponsored">Sponsored Section</SelectItem>
                    <SelectItem value="chain-specific">Chain-Specific</SelectItem>
                    <SelectItem value="custom">Custom Request</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="text-gray-900">
                  Additional Message *
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="mt-1.5 bg-white border-gray-300 text-gray-900 min-h-[120px]"
                  placeholder="Any additional details you'd like to share..."
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white"
              >
                {isSubmitting ? "Sending..." : "Submit Application"}
              </Button>
            </form>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-gray-600 text-center">
            Have questions? Contact us at{" "}
            <a href="mailto:magnificbets@gmail.com" className="text-gray-900 hover:underline">
              magnificbets@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
