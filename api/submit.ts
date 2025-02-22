import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../server/supabase';
import { supabaseBucketName } from '../server/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { audioData, email, deliveryDate } = req.body;

    if (!audioData || !email || !deliveryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(audioData.split(',')[1], 'base64');
    const fileName = `${Date.now()}.mp3`;

    // Upload to Supabase Storage
    const { data, error } = await supabase
      .storage
      .from(supabaseBucketName)
      .upload(fileName, buffer);

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return res.status(500).json({ error: 'Failed to upload audio' });
    }

    // // Send confirmation email
    // await sendConfirmationEmail(email, fileName, deliveryDate);

    // Return success
    return res.status(200).json({ success: true, fileName });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
