import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface LoginNotificationRequest {
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
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    }: LoginNotificationRequest = await req.json();

    console.log("Sending login notification for:", email);

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
      from: "BloodBank Pro <onboarding@resend.dev>",
      to: ["rajshekharverma286@gmail.com", email],
      subject: `🔔 User Login Alert - ${name} (${bloodGroup})`,
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
              <p>A donor has logged into BloodBank Pro</p>
            </div>
            
            <div class="content">
              <div class="timestamp">
                <strong>Login Time:</strong> ${loginTime}
              </div>

              <div class="info-section">
                <h2>Personal Information</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Full Name</div>
                    <div class="info-value">${name}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Email Address</div>
                    <div class="info-value">${email}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Phone Number</div>
                    <div class="info-value">${phone}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Age</div>
                    <div class="info-value">${age} years</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Gender</div>
                    <div class="info-value">${gender}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Weight</div>
                    <div class="info-value">${weight} kg</div>
                  </div>
                </div>
                
                <div style="margin-top: 15px;">
                  <div class="info-item">
                    <div class="info-label">Address</div>
                    <div class="info-value">${address}</div>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h2>Donor Information</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">Blood Group</div>
                    <div class="blood-group">${bloodGroup}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">Badge Level</div>
                    <div class="badge-display">${badge}</div>
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
              <p>This is an automated notification from BloodBank Pro</p>
              <p>&copy; 2025 BloodBank Pro. All rights reserved.</p>
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
