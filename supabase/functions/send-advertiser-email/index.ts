import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdvertiserEmailRequest {
  projectName: string;
  websiteUrl: string;
  email: string;
  projectDescription: string;
  placementType: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      projectName,
      websiteUrl,
      email,
      projectDescription,
      placementType,
      message,
    }: AdvertiserEmailRequest = await req.json();

    console.log("Received advertiser inquiry:", { projectName, websiteUrl, email, placementType });

    // TODO: Implement email sending using Resend
    // For now, we'll log the data
    // To enable email sending:
    // 1. Add RESEND_API_KEY secret
    // 2. Uncomment the Resend code below

    /*
    import { Resend } from "npm:resend@2.0.0";
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const emailResponse = await resend.emails.send({
      from: "ScreenerPilot <onboarding@resend.dev>",
      to: ["magnificbets@gmail.com"],
      subject: `New Advertiser Inquiry: ${projectName}`,
      html: `
        <h2>New Advertiser Application</h2>
        <p><strong>Project Name:</strong> ${projectName}</p>
        <p><strong>Website:</strong> <a href="${websiteUrl}">${websiteUrl}</a></p>
        <p><strong>Contact Email:</strong> ${email}</p>
        <p><strong>Placement Type:</strong> ${placementType}</p>
        
        <h3>Project Description:</h3>
        <p>${projectDescription}</p>
        
        <h3>Additional Message:</h3>
        <p>${message}</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);
    */

    // Return success (temporary - until email is configured)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Application received (email sending pending configuration)" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-advertiser-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
