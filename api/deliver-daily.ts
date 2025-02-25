export async function GET() {
    console.log("deliver daily starting...")
    const SUPABASE_FUNCTION_URL = 'https://sidjczqgkzxemruklsdd.supabase.co/functions/v1/deliverMessages';
    const BEARER_TOKEN = process.env.SUPABASE_KEY || '';  // Get from environment variable
    
    try {
        const response = await fetch(SUPABASE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'Content-Type': 'application/json'
            },
        });

        console.log("response received")

        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Failed to deliver messages:', error);
        return new Response(JSON.stringify({ error: 'Failed to deliver messages' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}   