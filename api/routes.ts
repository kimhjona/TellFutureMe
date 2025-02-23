import express, { type Express } from "express";
import { createServer, type Server } from "http";
import fetch from "node-fetch";
import { z } from "zod";
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



// Define a schema for voice note validation
const voiceNoteSchema = z.object({
  email: z.string().email(),
  deliveryDate: z.string(),
  fileName: z.string(),
});

export function registerRoutes(app: Express): Server {
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.post("/api/voice-notes", async (req, res) => {
    try {
      const entry = voiceNoteSchema.parse({
        email: req.body.email,
        deliveryDate: req.body.deliveryDate,
        fileName: req.body.fileName,
        sent: false
      });

      const { data, error } = await supabase
        .from("TellFutureMeDB")
        .insert([
          {
            file_name: entry.fileName,
            email: entry.email,
            delivery_date: entry.deliveryDate,
            created_at: new Date().toISOString(),
            sent: false
          }, 
        ])
        .select();

      if (error) {
        console.error("❌ Supabase DB insert error:", error); 
        throw error; 
      }

      const messageId = data[0].id; // Get the inserted row ID
      console.log("🔹 Message saved in DB with ID:", messageId);

      res.json({ message: "Voice note scheduled successfully" });
    } catch (error: any) {
      console.error("Voice note submission error:", error);
      res.status(500).json({ error: "Failed to schedule voice note" });
    }
  });

  app.post("/api/generate-signed-url", async (req, res) => {
    console.log("Generating signed URL:", req.body);
    const { fileName } = req.body;
    const { data, error } = await supabase.storage
      .from(supabaseBucketName)
      .createSignedUploadUrl(fileName); // URL valid for 60 seconds

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    console.log("Signed URL:", data.token);

    res.json({ token: data.token });
  });

  app.post("/api/confirmation-email", async (req, res) => {
    try {
      const { email, fileName, deliveryDate } = req.body;
      const emailSent = await sendConfirmationEmail(email, fileName, deliveryDate);
      res.json({ success: emailSent });
    } catch (error: any) {
      console.error("Email sending error:", error);
      res.status(500).json({ error: "Failed to send confirmation email" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
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