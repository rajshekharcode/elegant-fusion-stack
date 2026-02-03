import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Valid values
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const VALID_GENDERS = ['Male', 'Female', 'Other'];
const VALID_BADGES = ['Bronze', 'Silver', 'Gold'];

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
function validateLoginNotification(data: unknown): {
  valid: boolean;
  error?: string;
  data?: {
    name: string;
    email: string;
    bloodGroup: string;
    phone: string;
    address: string;
    age: number;
    gender: string;
    weight: number;
    donationCount: number;
    badge: string;
    eligible: boolean;
    loginTime: string;
  };
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { name, email, bloodGroup, phone, address, age, gender, weight, donationCount, badge, eligible, loginTime } = data as Record<string, unknown>;

  // Validate name
  if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
    return { valid: false, error: 'Invalid name' };
  }

  // Validate email
  if (typeof email !== 'string') {
    return { valid: false, error: 'Invalid email' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return { valid: false, error: 'Invalid email address' };
  }

  // Validate blood group
  if (typeof bloodGroup !== 'string' || !VALID_BLOOD_GROUPS.includes(bloodGroup)) {
    return { valid: false, error: 'Invalid blood group' };
  }

  // Validate phone
  if (typeof phone !== 'string' || phone.length > 20) {
    return { valid: false, error: 'Invalid phone' };
  }

  // Validate address
  if (typeof address !== 'string' || address.length > 300) {
    return { valid: false, error: 'Invalid address' };
  }

  // Validate age
  if (typeof age !== 'number' || age < 18 || age > 120) {
    return { valid: false, error: 'Invalid age' };
  }

  // Validate gender
  if (typeof gender !== 'string' || !VALID_GENDERS.includes(gender)) {
    return { valid: false, error: 'Invalid gender' };
  }

  // Validate weight
  if (typeof weight !== 'number' || weight < 30 || weight > 300) {
    return { valid: false, error: 'Invalid weight' };
  }

  // Validate donationCount
  if (typeof donationCount !== 'number' || donationCount < 0 || donationCount > 1000) {
    return { valid: false, error: 'Invalid donation count' };
  }

  // Validate badge
  if (typeof badge !== 'string' || !VALID_BADGES.includes(badge)) {
    return { valid: false, error: 'Invalid badge' };
  }

  // Validate eligible
  if (typeof eligible !== 'boolean') {
    return { valid: false, error: 'Invalid eligible status' };
  }

  // Validate loginTime
  if (typeof loginTime !== 'string' || loginTime.length > 100) {
    return { valid: false, error: 'Invalid login time' };
  }

  return {
    valid: true,
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      bloodGroup,
      phone: phone.trim(),
      address: address.trim(),
      age,
      gender,
      weight,
      donationCount,
      badge,
      eligible,
      loginTime: loginTime.trim(),
    },
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    // Check request size
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50000) {
      return new Response(
        JSON.stringify({ error: 'Request too large' }),
        { status: 413, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawData = await req.json();
    const validation = validateLoginNotification(rawData);

    if (!validation.valid || !validation.data) {
      console.log("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      name,
      email,
      bloodGroup,
      phone,
      address,
      age,
      gender,
      weight,
      donationCount,
      badge,
      eligible,
      loginTime,
    } = validation.data;

    console.log("Sending login notification for:", email);

    // Escape all user inputs for HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeBloodGroup = escapeHtml(bloodGroup);
    const safePhone = escapeHtml(phone);
    const safeAddress = escapeHtml(address);
    const safeGender = escapeHtml(gender);
    const safeBadge = escapeHtml(badge);
    const safeLoginTime = escapeHtml(loginTime);

    const eligibilityBadge = eligible
      ? '<span style="display: inline-block; padding: 4px 12px; background-color: #22c55e; color: white; border-radius: 4px; font-weight: 600;">✓ Eligible</span>'
      : '<span style="display: inline-block; padding: 4px 12px; background-color: #ef4444; color: white; border-radius: 4px; font-weight: 600;">✗ Not Eligible</span>';

    const badgeColor =
      badge === "Gold"
        ? "#fbbf24"
        : badge === "Silver"
        ? "#9ca3af"
        : "#cd7f32";

    // Send to both admin and the logged-in user
    const emailResponse = await resend.emails.send({
      from: "BloodBank <onboarding@resend.dev>",
      to: [Deno.env.get("ADMIN_ALERT_EMAIL") as string, email],
      subject: `🔔 User Login Alert - ${safeName} (${safeBloodGroup})`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 20px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .header p {
              margin: 5px 0 0 0;
              opacity: 0.95;
              font-size: 14px;
            }
            .content {
              padding: 30px;
            }
            .info-section {
              margin-bottom: 25px;
            }
            .info-section h2 {
              color: #dc2626;
              font-size: 18px;
              margin: 0 0 15px 0;
              padding-bottom: 8px;
              border-bottom: 2px solid #fecaca;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-top: 10px;
            }
            .info-item {
              background-color: #f9fafb;
              padding: 12px;
              border-radius: 6px;
              border-left: 3px solid #dc2626;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.5px;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 16px;
              color: #111827;
              font-weight: 600;
            }
            .blood-group {
              display: inline-block;
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 20px;
              font-weight: bold;
              margin-top: 5px;
            }
            .badge-display {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-weight: 600;
              font-size: 14px;
              color: white;
              background-color: ${badgeColor};
              margin-top: 5px;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
              border-top: 1px solid #e5e7eb;
            }
            .timestamp {
              background-color: #dbeafe;
              color: #1e40af;
              padding: 10px;
              border-radius: 6px;
              text-align: center;
              font-size: 14px;
              margin-bottom: 20px;
            }
            @media only screen and (max-width: 600px) {
              .info-grid {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 User Login Notification</h1>
              <p>A donor has logged into BloodBank</p>
            </div>
            
            <div class="content">
              <div class="timestamp">
                <strong>Login Time:</strong> ${safeLoginTime}
              </div>

              <div class="info-section">
                <h2>Personal Information</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${safeName}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">${safeEmail}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone Number</div>
                    <div class="info-value">${safePhone}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Age</div>
                    <div class="info-value">${age} years</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Gender</div>
                    <div class="info-value">${safeGender}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Weight</div>
                    <div class="info-value">${weight} kg</div>
                  </div>
                </div>
                
                <div style="margin-top: 15px;">
                  <div class="info-item">
                    <div class="info-label">Address</div>
                    <div class="info-value">${safeAddress}</div>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h2>Donor Information</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Blood Group</div>
                    <div class="blood-group">${safeBloodGroup}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Badge Level</div>
                    <div class="badge-display">${safeBadge}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Total Donations</div>
                    <div class="info-value">${donationCount} donations</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Eligibility Status</div>
                    <div style="margin-top: 8px;">${eligibilityBadge}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="footer">
              <p>This is an automated notification from BloodBank</p>
              <p>&copy; 2025 BloodBank. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Login notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending login notification:", error);
    return new Response(JSON.stringify({ error: "Failed to send notification" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
