import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Body = {
  code: string;
  redirect_uri: string;
  code_verifier: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const { code, redirect_uri, code_verifier } = (await req.json()) as Body;
    if (!code || !redirect_uri || !code_verifier) {
      return new Response(
        JSON.stringify({ error: "Missing code, redirect_uri, or code_verifier" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const client_id = Deno.env.get("JIRA_OAUTH_CLIENT_ID") ?? "";
    const client_secret = Deno.env.get("JIRA_OAUTH_CLIENT_SECRET") ?? "";

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: "Server missing JIRA_OAUTH_CLIENT_ID" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const tokenBody: Record<string, string> = {
      grant_type: "authorization_code",
      client_id,
      code,
      redirect_uri,
      code_verifier,
    };
    if (client_secret) {
      tokenBody.client_secret = client_secret;
    }

    const tokenRes = await fetch("https://auth.atlassian.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tokenBody),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: tokenJson }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const access_token = tokenJson.access_token as string;
    const refresh_token = tokenJson.refresh_token as string | undefined;
    const expires_in = tokenJson.expires_in as number | undefined;

    const [arRes, meRes] = await Promise.all([
      fetch("https://api.atlassian.com/oauth/token/accessible-resources", {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
      fetch("https://api.atlassian.com/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      }),
    ]);

    const resources = await arRes.json();
    const me = await meRes.json();

    if (!arRes.ok) {
      return new Response(
        JSON.stringify({
          error: "accessible-resources failed",
          details: resources,
        }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        access_token,
        refresh_token,
        expires_in,
        resources: Array.isArray(resources) ? resources : [],
        me: meRes.ok ? me : null,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
