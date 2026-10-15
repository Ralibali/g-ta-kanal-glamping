const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  return new Response(JSON.stringify({ error: "This temporary administration endpoint has been retired." }), {
    status: 410,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
});
