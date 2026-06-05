import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// Helper to determine device category from user-agent
function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return "Other";
  const ua = userAgent.toLowerCase();
  if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone") || ua.includes("ipod")) {
    if (ua.includes("ipad") || ua.includes("tablet") || ua.includes("playbook") || ua.includes("silk")) {
      return "Tablet";
    }
    return "Mobile";
  }
  if (ua.includes("ipad") || ua.includes("tablet") || ua.includes("playbook") || ua.includes("silk")) {
    return "Tablet";
  }
  return "Desktop";
}

// Helper to parse referrer source
function parseReferrer(referrerUrl: string | null): string {
  if (!referrerUrl) return "Direct";
  try {
    const url = new URL(referrerUrl);
    const host = url.hostname.toLowerCase();
    if (host.includes("google.com")) return "Google";
    if (host.includes("facebook.com")) return "Facebook";
    if (host.includes("t.co") || host.includes("twitter.com") || host.includes("x.com")) return "Twitter";
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host.includes("instagram.com")) return "Instagram";
    if (host.includes("youtube.com")) return "YouTube";
    if (host.includes("reddit.com")) return "Reddit";
    return url.hostname;
  } catch {
    return "External";
  }
}

http.route({
  pathPrefix: "/s/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    // Extract slug (everything after "/s/")
    const slug = url.pathname.slice(3);
    
    if (!slug) {
      return new Response("Missing slug", { status: 400 });
    }

    // 1. Fetch link via query
    const link = await ctx.runQuery(api.links.getLinkBySlug, { slug });
    
    // 2. Handle missing link
    if (!link) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Link Not Found - Scissor</title>
            <style>
              body { background: #050407; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { text-align: center; border: 1px solid rgba(239, 68, 68, 0.2); padding: 40px; border-radius: 16px; background: rgba(13, 11, 20, 0.8); max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
              h1 { color: #f87171; font-size: 28px; margin: 0 0 16px; font-weight: 700; }
              p { color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
              a { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
              a:hover { background: #7c3aed; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Not Found</h1>
              <p>The short link you are trying to access does not exist, has been deleted, or was entered incorrectly.</p>
              <a href="/">Go to Scissor</a>
            </div>
          </body>
        </html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html" }
        }
      );
    }

    // 3. Handle expired link
    if (link.status === "expired" || (link.expiresAt && link.expiresAt <= Date.now())) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Link Expired - Scissor</title>
            <style>
              body { background: #050407; color: #f1f5f9; font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .card { text-align: center; border: 1px solid rgba(139, 92, 246, 0.2); padding: 40px; border-radius: 16px; background: rgba(13, 11, 20, 0.8); max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); backdrop-filter: blur(10px); }
              h1 { color: #c084fc; font-size: 28px; margin: 0 0 16px; font-weight: 700; }
              p { color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
              a { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; }
              a:hover { background: #7c3aed; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Link Expired</h1>
              <p>This short link has expired and is no longer accepting redirects. Access to this destination is gone.</p>
              <a href="/">Go to Scissor</a>
            </div>
          </body>
        </html>`,
        {
          status: 410,
          headers: { "Content-Type": "text/html" }
        }
      );
    }

    // 4. Capture Click Analytics from Request Headers
    const userAgent = request.headers.get("user-agent");
    const referrerUrl = request.headers.get("referer");
    // Retrieve country from Vercel header first, then Cloudflare, then fallback
    const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "US"; 
    
    const device = getDeviceType(userAgent);
    const referrer = parseReferrer(referrerUrl);

    // 5. Track click asynchronously
    await ctx.runMutation(api.clicks.trackClick, {
      linkId: link._id,
      referrer,
      country,
      device,
    });

    // 6. Return 302 Found Redirect
    return Response.redirect(link.originalUrl, 302);
  }),
});

export default http;
