// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
console.info('server started');
Deno.serve(async (req)=>{
  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '');
  // get name, phone, and email from request body
  const reqBody = await req.json();
  const { name, phone } = reqBody;

  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: {
      headers: {
        Authorization: `Bearer ${jwt}`
      }
    }
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  // handle error fetching user data
  if (error) {
    // Handle error
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 401
    });
  }

  const createClientResponse = await fetch('https://connect.squareup.com/v2/customers', {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "Square-Version": "2025-09-24",
      "Authorization": `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN")}`
    },
    body: JSON.stringify({
      "given_name": name || "",
      "family_name": "",
      "email_address": user.email || "Amelia.Earhart@example.com",
      "phone_number": phone || "",
      "note": "Created through the One Cut Above App"
    })
  });
  return createClientResponse;
});
