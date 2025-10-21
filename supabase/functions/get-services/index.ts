// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info('server started');

Deno.serve(async ()=>{
  const servicesResponse = await fetch('https://connect.squareupsandbox.com/v2/catalog/list', {
    headers: {
      "Square-Version": "2025-09-24",
      "Authorization": `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN")}`,
      "Content-type": "application/json"
    }
  });

  return servicesResponse;
});