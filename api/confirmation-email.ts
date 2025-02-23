import {VercelRequest, VercelResponse} from "@vercel/node";
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export const supabaseBucketName = "TellFutureMe";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, fileName, deliveryDate } = req.body;
        const emailSent = await sendConfirmationEmail(email, fileName, deliveryDate);
        res.json({ success: emailSent });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Failed at api/confirmation-email' });
    }
  }

  async function sendConfirmationEmail(email: string, fileName: string, deliveryDate: string): Promise<boolean> {
    console.log(`📨 Sending confirmation email to ${email} ...`);
  
    const formattedDate = formatDate(deliveryDate);
  
    const emailPayload = {
        from: "Tell Future Me <no-reply@send.tellfutureme.com>",
        to: [email],
        subject: `🎙️ Your Future Voice Note is Scheduled!`,
        html: emailHtml(formattedDate)
    };
  
    const RESEND_API_KEY = process.env.RESEND_API_KEY
  
    if (!RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY is missing! Check your environment variables.");
        return false;
    }
  
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailPayload),
    });
  
    const responseBody = await response.json();
  
    console.log("✅ Email sent:", {response, responseBody});
    return true;
  } 
  
function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Date.UTC(+year, +month - 1, +day));
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'  // Important: this ensures consistent output
    });
}
  


const emailHtml = (formattedDate: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Future Voice Note is Scheduled!</title>
    <style type="text/css">
        /* Previous CSS styles remain the same */
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); color: white; padding: 20px; text-align: center; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                            <h1 style="margin: 0; font-size: 24px; color: white;">🎙️ Your Future Voice Note</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px; color: #333; line-height: 1.6;">
                            <p style="margin: 0 0 15px 0; font-size: 16px;">
                                Hey there! 👋
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px;">
                                Your voice note is all set and scheduled for delivery on <strong>${formattedDate}</strong>. 🎉
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px;">
                                Get ready to hear a message from yourself in the future! It's like sending a time capsule to your future self. 🕰️
                            </p>
                        </td>
                    </tr>
                    <!-- CTA -->
                    <tr>
                        <td align="center" style="padding: 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: #2575fc; border-radius: 6px; padding: 12px 24px;">
                                        <a href="https://tellfutureme.com" target="_blank" style="color: white; text-decoration: none; font-size: 16px; font-weight: bold;">Schedule Another Voice Note</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Social Links -->
                    <tr>
                        <td align="center" style="padding: 20px; background-color: #f4f4f4; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding: 0 10px;">
                                        <a href="https://x.com/tellfutureme_" target="_blank" style="color: #2575fc; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            X: @tellfutureme_
                                        </a>
                                    </td>
                                    <td style="padding: 0 10px;">
                                        <a href="https://www.instagram.com/tellfutureme/" target="_blank" style="color: #2575fc; text-decoration: none; font-weight: bold; font-size: 16px;">
                                            Instagram: @tellfutureme
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`