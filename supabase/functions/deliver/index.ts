import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Buffer } from "https://deno.land/std/io/buffer.ts";

// Supabase environment variables
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  try {
    console.log('Fetching scheduled deliveries...');

    // // Load FFmpeg
    // await ffmpeg.load({
    //   coreURL: await toBlobURL(
    //     `https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm/ffmpeg-core.js`,
    //     'text/javascript'
    //   ),
    // });

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: entries, error } = await supabase
      .from('TellFutureMeDB') 
      .select('email, file_name')
      .eq('delivery_date', today);

    if (error) throw error;
    if (!entries || entries.length === 0) return new Response('No deliveries today.', { status: 200 });

    for (const entry of entries) {
      const {  email, file_name } = entry;

      // Download the .webm file
      const { data, error: downloadError } = await supabase.storage
        .from('TellFutureMe')
        .download(file_name);

      if (downloadError) {
        console.error(`Failed to download file: ${file_name}`, downloadError);
        continue;
      }

      // // Convert WebM to MP3
      // ffmpeg.writeFile('input.webm', new Uint8Array(await fileData.arrayBuffer()));
      // await ffmpeg.exec(['-i', 'input.webm', '-vn', '-acodec', 'libmp3lame', 'output.mp3']);
      // const mp3Data = await ffmpeg.readFile('output.mp3');

      // Send Email with Resend API
      const emailPayload = {
        from: "Tell Future Me <no-reply@send.tellfutureme.com>",
        to: [email],
        subject: "🎙️ Your Voice Note from the Past Has Arrived!",
        html: deliveryEmailHtml,
        attachments: [{
          filename: `${email}_${today}.mp3`,
          content: mp3Data,
        }],
      };

      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

      if (!RESEND_API_KEY) {
        console.error("❌ RESEND_API_KEY is missing! Check your environment variables.");
        continue;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        console.error(`❌ Failed to send email to ${email}`);
        continue;
      }

      const responseBody = await response.json();
      console.log("✅ Voice note email sent:", { response, responseBody });

      if (!response.ok) {
        console.error(`Failed to send email to ${email}`);
        continue;
      }

      console.log(`Email sent successfully to ${email}`);

      // Cleanup: Remove temp files
      await unlink(tempFilePath);
      await unlink(mp3FilePath);
    }

    return new Response('Deliveries processed.', { status: 200 });
  } catch (err) {
    console.error('Error in scheduled deliveries', err);
    return new Response('Internal Server Error', { status: 500 });
  }
})
