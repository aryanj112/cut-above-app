// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info('server started');

Deno.serve(async (req) => {
  try {
    const res = await fetch('https://connect.squareup.com/v2/locations', {
      headers: {
        "Square-Version": "2025-10-16",
        "Authorization": `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN")}`,
        "Content-type": "application/json"
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Square API Error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch locations from Square",
          details: errorText
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const data = await res.json();
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in get-locations function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});