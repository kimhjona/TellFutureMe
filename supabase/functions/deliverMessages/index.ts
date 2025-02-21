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
            html: `Your scheduled message is here! 🎶 <a href=${fileUrl} target="_blank" font-size: 16px; font-weight: bold;">Here</a>
 is your voice note.`,
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
