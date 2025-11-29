// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
console.info('server started');

Deno.serve(async (req) => {
  try {
    const servicesResponse = await fetch('https://connect.squareup.com/v2/catalog/list', {
      headers: {
        "Square-Version": "2025-10-16",
        "Authorization": `Bearer ${Deno.env.get("SQUARE_ACCESS_TOKEN")}`,
        "Content-type": "application/json"
      }
    });

    if (!servicesResponse.ok) {
      const errorText = await servicesResponse.text();
      console.error("Square API Error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch services from Square",
          details: errorText
        }),
        {
          status: servicesResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const data = await servicesResponse.json();
    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in get-services function:", error);
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