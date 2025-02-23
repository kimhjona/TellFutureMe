import {VercelRequest, VercelResponse} from "@vercel/node";
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { z } from "zod";

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


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { fileName, email, deliveryDate } = req.body;

      if (!fileName || !email || !deliveryDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

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

      res.status(200).json({ message: "Voice note scheduled successfully" });
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Failed at api/voice-notes' });
    }
  }