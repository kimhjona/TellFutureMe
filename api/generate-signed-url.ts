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
    } catch (error) {
      console.error('Server error:', error);
      return res.status(500).json({ error: 'Failed at api/generate-signed-url' });
    }
  }