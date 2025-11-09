import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmergencyRequest {
  patientName: string;
  hospitalName: string;
  bloodGroup: string;
  unitsRequired: string;
  urgency: string;
  contactPerson: string;
  phone: string;
}

const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case "Critical": return "#DC2626";
    case "High": return "#EA580C";
    case "Medium": return "#F59E0B";
    default: return "#10B981";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patientName, hospitalName, bloodGroup, unitsRequired, urgency, contactPerson, phone }: EmergencyRequest = await req.json();
    
    console.log("Sending emergency blood request alert for:", patientName);

    const urgencyColor = getUrgencyColor(urgency);

    // Send email to the blood bank admin
    const emailResponse = await resend.emails.send({
      from: "Blood Bank Emergency <onboarding@resend.dev>",
      to: [Deno.env.get("ADMIN_ALERT_EMAIL") as string],
      subject: `🚨 URGENT: Emergency Blood Request - ${bloodGroup} - ${urgency}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY BLOOD REQUEST</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">${urgency} URGENCY</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">Request Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Patient Name:</td>
                <td style="padding: 12px 0; color: #1f2937;">${patientName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Hospital:</td>
                <td style="padding: 12px 0; color: #1f2937;">${hospitalName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Blood Group:</td>
                <td style="padding: 12px 0; color: #dc2626; font-size: 18px; font-weight: bold;">${bloodGroup}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Units Required:</td>
                <td style="padding: 12px 0; color: #1f2937; font-weight: bold;">${unitsRequired} units</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Contact Person:</td>
                <td style="padding: 12px 0; color: #1f2937;">${contactPerson}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Phone:</td>
                <td style="padding: 12px 0;"><a href="tel:${phone}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${phone}</a></td>
              </tr>
            </table>
            
            <div style="margin-top: 24px; padding: 16px; background-color: white; border-left: 4px solid ${urgencyColor}; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-weight: bold;">⏰ Request Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
            
            <div style="margin-top: 24px; text-align: center;">
              <a href="tel:${phone}" style="display: inline-block; background-color: ${urgencyColor}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">📞 Call Now</a>
            </div>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Blood Bank Management System - Emergency Alert</p>
          </div>
        </div>
      `,
    });

    console.log("Emergency alert email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-emergency-alert function:", error);
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
