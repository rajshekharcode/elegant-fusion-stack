import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Valid values
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VALID_STATUSES = ['Approved', 'Rejected', 'Pending', 'Fulfilled'];

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
function validateStatusNotification(data: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    email: string;
    patientName: string;
    hospitalName: string;
    bloodGroup: string;
    unitsRequired: string;
    status: string;
    contactPerson: string;
  };
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { email, patientName, hospitalName, bloodGroup, unitsRequired, status, contactPerson } = data as Record<string, unknown>;

  // Validate email
  if (typeof email !== 'string') {
    return { valid: false, error: 'Invalid email' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return { valid: false, error: 'Invalid email address' };
  }

  // Validate patient name
  if (typeof patientName !== 'string' || patientName.trim().length === 0 || patientName.length > 100) {
    return { valid: false, error: 'Invalid patient name' };
  }

  // Validate hospital name
  if (typeof hospitalName !== 'string' || hospitalName.trim().length === 0 || hospitalName.length > 200) {
    return { valid: false, error: 'Invalid hospital name' };
  }

  // Validate blood group
  if (typeof bloodGroup !== 'string' || !VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return { valid: false, error: 'Invalid blood group' };
  }

  // Validate units required
  const units = typeof unitsRequired === 'string' ? parseInt(unitsRequired) : unitsRequired;
  if (typeof units !== 'number' || isNaN(units) || units < 1 || units > 50) {
    return { valid: false, error: 'Invalid units required' };
  }

  // Validate status
  if (typeof status !== 'string' || !VALID_STATUSES.includes(status)) {
    return { valid: false, error: 'Invalid status' };
  }

  // Validate contact person
  if (typeof contactPerson !== 'string' || contactPerson.trim().length === 0 || contactPerson.length > 100) {
    return { valid: false, error: 'Invalid contact person' };
  }

  return {
    valid: true,
    data: {
      email: email.trim().toLowerCase(),
      patientName: patientName.trim(),
      hospitalName: hospitalName.trim(),
      bloodGroup,
      unitsRequired: String(units),
      status,
      contactPerson: contactPerson.trim(),
    },
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication (admin only should send status notifications)
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

    // Check request size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50000) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawData = await req.json();
    const validation = validateStatusNotification(rawData);

    if (!validation.valid || !validation.data) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, patientName, hospitalName, bloodGroup, unitsRequired, status, contactPerson } = validation.data;
    
    console.log("Sending status notification for:", patientName, "to:", email);

    // Escape all user inputs for HTML
    const safePatientName = escapeHtml(patientName);
    const safeHospitalName = escapeHtml(hospitalName);
    const safeBloodGroup = escapeHtml(bloodGroup);
    const safeUnitsRequired = escapeHtml(unitsRequired);
    const safeStatus = escapeHtml(status);
    const safeContactPerson = escapeHtml(contactPerson);

    const isApproved = status === "Approved";
    const statusColor = isApproved ? "#10B981" : "#EF4444";
    const statusText = isApproved ? "APPROVED ✓" : "REJECTED ✗";
    const messageText = isApproved 
      ? "We are pleased to inform you that your blood request has been approved. Our team will contact you shortly to coordinate the blood supply."
      : "We regret to inform you that your blood request could not be approved at this time. This may be due to stock availability or other factors. Please contact us for alternative options.";

    const emailResponse = await resend.emails.send({
      from: "Blood Bank <onboarding@resend.dev>",
      to: [email],
      subject: `Blood Request ${statusText} - ${safeBloodGroup}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Blood Request ${statusText}</h1>
          </div>
          
          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
            <p style="color: #1f2937; font-size: 16px; line-height: 1.5;">Dear ${safeContactPerson},</p>
            
            <p style="color: #1f2937; font-size: 16px; line-height: 1.5; margin: 20px 0;">
              ${messageText}
            </p>
            
            <h2 style="color: #1f2937; margin-top: 24px;">Request Details</h2>
            
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
              <tr>
                <td style="padding: 12px 0; font-weight: bold; color: #374151;">Units Required:</td>
                <td style="padding: 12px 0; color: #1f2937; font-weight: bold;">${safeUnitsRequired} units</td>
              </tr>
            </table>
            
            <div style="margin-top: 24px; padding: 16px; background-color: white; border-left: 4px solid ${statusColor}; border-radius: 4px;">
              <p style="margin: 0; color: #374151; font-weight: bold;">Status: ${safeStatus}</p>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">Updated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
            </div>
            
            ${isApproved ? `
              <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border-radius: 4px;">
                <p style="margin: 0; color: #166534; font-weight: bold;">Next Steps:</p>
                <p style="margin: 8px 0 0 0; color: #166534;">Our team will reach out to you within the next few hours to arrange the blood supply delivery.</p>
              </div>
            ` : ''}
          </div>
          
          <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-radius: 0 0 8px 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Blood Bank Management System</p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">For urgent inquiries, please contact our helpline.</p>
          </div>
        </div>
      `,
    });

    console.log("Status notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
