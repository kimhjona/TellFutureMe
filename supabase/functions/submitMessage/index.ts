import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function sendConfirmationEmail(email: string, fileName: string, deliveryDate: string): Promise<boolean> {
    console.log(`📨 Sending confirmation email to ${email} ...`);

    const emailPayload = {
        from: "Tell Future Me <no-reply@send.tellfutureme.com>",
        to: [email],
        subject: `🎙️ Your Future Voice Note is Scheduled!`,
        html: `Hey! Your voice note is scheduled for delivery on ${deliveryDate}. We'll send it then! 🎉`,
    };

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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

    console.log("✅ Email sent:", responseBody);

    if (!responseBody.ok) {
        console.error("❌ Email failed to send:", response);
        return false;
    }

    console.log("✅ Email sent:", responseBody);
    return true;
}

// 📌 Serve the function
serve(async (req) => {
    try {
        // 📝 Parse request data
        const { fileName, email, deliveryDate } = await req.json();

        if (!fileName || !email || !deliveryDate) {
            return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
        }

        console.log("📌 Received request:", { fileName, email, deliveryDate });

        // 🔹 Step 1: Insert into Supabase DB (mark initially as unconfirmed)
        const { data, error } = await supabase.from("TellFutureMeDB").insert([
            {
                file_name: fileName,
                email,
                delivery_date: deliveryDate,
                created_at: new Date().toISOString(),
            },
        ]).select();

        if (error) {
            console.error("❌ Supabase DB insert error:", error);
            throw error;
        }

        const messageId = data[0].id; // Get the inserted row ID
        console.log("🔹 Message saved in DB with ID:", messageId);

        // 🔹 Step 2: Send a confirmation email
        const emailSent = await sendConfirmationEmail(email, fileName, deliveryDate);
        if (!emailSent) {
            console.error("❌ Email failed to send!");
            return new Response(JSON.stringify({ error: "Failed to send confirmation email" }), { status: 500 });
        }

        // 🔹 Step 3: Update DB to confirm the email was sent successfully
        await supabase.from("scheduled_messages").update({ confirmed: true }).eq("id", messageId);

        console.log("✅ DB updated. Message is now confirmed.");

        return new Response(JSON.stringify({ message: "Message scheduled & email sent!", messageId }), { status: 200 });

    } catch (error) {
        console.error("❌ Error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
    }
});