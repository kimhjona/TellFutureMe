import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Send email with MP3 attachment
async function sendEmail(email: string, fileUrl: string) {
    console.log(`📧 Sending email to ${email} with attachment ${fileUrl}...`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
  
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from: "Tell Future Me <no-reply@send.tellfutureme.com>",
            to: email,
            subject: `🎙️ Your Future Voice Note is Ready!`,
            html: getEmailHtml(fileUrl),
        }),
    });

    return response.ok;
}

serve(async () => {
    try {
        const today = new Date().toISOString().split("T")[0];
        console.log(`📅 Running cron job for scheduled messages on ${today}`);

        // Fetch messages scheduled for today
        const { data: messages, error } = await supabase
            .from("TellFutureMeDB")
            .select("*")
            .eq("delivery_date", today)
            .eq("sent", false);

        if (error) throw error;
        console.log(`✅ Found ${messages.length} messages to deliver.`);

        for (const message of messages) {
            const { file_name, email } = message;

            const { data, error } = await supabase
            .storage
            .from("TellFutureMe")
            .createSignedUrl(file_name, 604800, {download: true})

            if (error) throw error;

            // Send email with MP3 attachment
            const emailSent = await sendEmail(email, data.signedUrl);

            if (emailSent) {
                console.log(`📨 Successfully sent ${file_name} to ${email}`);
                await supabase.from("TellFutureMeDB").update({ sent: true }).eq("file_name", message.file_name);
            } else {
                console.error(`❌ Failed to send ${file_name} to ${email}`);
            }
        }

        return new Response(JSON.stringify({ message: "Emails sent successfully" }), { status: 200 });

    } catch (error) {
        console.error("❌ Error in scheduled job:", error);
        return new Response(JSON.stringify({ error: "Scheduled job failed" }), { status: 500 });
    }
});


function getEmailHtml(downloadUrl: string) {
    return (
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Future Voice Note Has Arrived!</title>
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
                            <h1 style="margin: 0; font-size: 24px; color: white;">🎙️ Your Voice Note Has Arrived!</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px; color: #333; line-height: 1.6;">
                            <p style="margin: 0 0 15px 0; font-size: 16px;">
                                Hey there! 👋
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px;">
                                Remember that voice note you recorded for your future self? 🎉
                            </p>
                            <p style="margin: 0 0 15px 0; font-size: 16px;">
                                Your message has traveled through time and is ready for you to listen. Click the button below to download your voice note and hear what past you had to say! 🎧
                            </p>
                            <p>
                              Your link will be available only for the next 7 days, so be sure to save your file.
                          </p>
                        </td>
                    </tr>
                    <!-- Download CTA -->
                    <tr>
                        <td align="center" style="padding: 20px;">
                            <table border="0" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="background-color: #2575fc; border-radius: 6px; padding: 12px 24px;">
                                        <a href="${downloadUrl}" target="_blank" style="color: white; text-decoration: none; font-size: 16px; font-weight: bold;">Download Your Voice Note</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Record Another Note CTA -->
                    <tr>
                        <td style="padding: 20px; text-align: center;">
                            <p style="margin: 0 0 15px 0; font-size: 16px;">
                                Want to send another message to your future self?
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="background-color: #f4f4f4; border-radius: 6px; padding: 12px 24px;">
                                        <a href="https://tellfutureme.com" target="_blank" style="color: #2575fc; text-decoration: none; font-size: 16px; font-weight: bold;">Record Another Voice Note</a>
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
</html>
`
    )
}