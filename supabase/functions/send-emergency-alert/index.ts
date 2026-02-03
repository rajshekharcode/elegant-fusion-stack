import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid blood groups
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VALID_URGENCY_LEVELS = ['Critical', 'High', 'Medium', 'Low'];

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Input validation
function validateEmergencyInput(data: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    patientName: string;
    hospitalName: string;
    bloodGroup: string;
    unitsRequired: string;
    urgency: string;
    contactPerson: string;
    phone: string;
  };
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { patientName, hospitalName, bloodGroup, unitsRequired, urgency, contactPerson, phone } = data as Record<string, unknown>;

  // Validate patient name
  if (typeof patientName !== 'string' || patientName.trim().length === 0) {
    return { valid: false, error: 'Patient name is required' };
  }
  if (patientName.length > 100) {
    return { valid: false, error: 'Patient name must be less than 100 characters' };
  }

  // Validate hospital name
  if (typeof hospitalName !== 'string' || hospitalName.trim().length === 0) {
    return { valid: false, error: 'Hospital name is required' };
  }
  if (hospitalName.length > 200) {
    return { valid: false, error: 'Hospital name must be less than 200 characters' };
  }

  // Validate blood group
  if (typeof bloodGroup !== 'string' || !VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return { valid: false, error: 'Invalid blood group' };
  }

  // Validate units required
  const units = typeof unitsRequired === 'string' ? parseInt(unitsRequired) : unitsRequired;
  if (typeof units !== 'number' || isNaN(units) || units < 1 || units > 50) {
    return { valid: false, error: 'Units required must be between 1 and 50' };
  }

  // Validate urgency
  if (typeof urgency !== 'string' || !VALID_URGENCY_LEVELS.includes(urgency)) {
    return { valid: false, error: 'Invalid urgency level' };
  }

  // Validate contact person
  if (typeof contactPerson !== 'string' || contactPerson.trim().length === 0) {
    return { valid: false, error: 'Contact person is required' };
  }
  if (contactPerson.length > 100) {
    return { valid: false, error: 'Contact person must be less than 100 characters' };
  }

  // Validate phone
  if (typeof phone !== 'string' || phone.trim().length === 0) {
    return { valid: false, error: 'Phone is required' };
  }
  // Basic phone validation (allow digits, spaces, dashes, plus)
  const phoneRegex = /^[\d\s\-+()]{8,20}$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  return {
    valid: true,
    data: {
      patientName: patientName.trim(),
      hospitalName: hospitalName.trim(),
      bloodGroup,
      unitsRequired: String(units),
      urgency,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
    },
  };
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
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("No authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.log("Invalid token:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check request size (limit to 50KB)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50000) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawData = await req.json();
    const validation = validateEmergencyInput(rawData);

    if (!validation.valid || !validation.data) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { patientName, hospitalName, bloodGroup, unitsRequired, urgency, contactPerson, phone } = validation.data;
    
    console.log("Sending emergency blood request alert for:", patientName);

    const urgencyColor = getUrgencyColor(urgency);

    // Escape all user inputs for HTML
    const safePatientName = escapeHtml(patientName);
    const safeHospitalName = escapeHtml(hospitalName);
    const safeBloodGroup = escapeHtml(bloodGroup);
    const safeUnitsRequired = escapeHtml(unitsRequired);
    const safeUrgency = escapeHtml(urgency);
    const safeContactPerson = escapeHtml(contactPerson);
    const safePhone = escapeHtml(phone);

    // Send email to the blood bank admin
    const emailResponse = await resend.emails.send({
      from: "Blood Bank Emergency <onboarding@resend.dev>",
      to: [Deno.env.get("ADMIN_ALERT_EMAIL") as string],
      subject: `🚨 URGENT: Emergency Blood Request - ${safeBloodGroup} - ${safeUrgency}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 EMERGENCY BLOOD REQUEST</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; font-weight: bold;">${safeUrgency} URGENCY</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1f2937; margin-top: 0;">Request Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Patient Name:</td>
                <td style="padding: 12px 0; color: #1f2937;">${safePatientName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Hospital:</td>
                <td style="padding: 12px 0; color: #1f2937;">${safeHospitalName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Blood Group:</td>
                <td style="padding: 12px 0; color: #dc2626; font-size: 18px; font-weight: bold;">${safeBloodGroup}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Units Required:</td>
                <td style="padding: 12px 0; color: #1f2937; font-weight: bold;">${safeUnitsRequired} units</td>
              </tr>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Contact Person:</td>
                <td style="padding: 12px 0; color: #1f2937;">${safeContactPerson}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Phone:</td>
                <td style="padding: 12px 0;"><a href="tel:${safePhone}" style="color: #2563eb; text-decoration: none; font-weight: bold;">${safePhone}</a></td>
              </tr>
            </table>
            
            <div style="margin-top: 24px; padding: 16px; background-color: white; border-left: 4px solid ${urgencyColor}; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-weight: bold;">⏰ Request Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
            
            <div style="margin-top: 24px; text-align: center;">
              <a href="tel:${safePhone}" style="display: inline-block; background-color: ${urgencyColor}; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">📞 Call Now</a>
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
      JSON.stringify({ error: "Failed to send alert" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
