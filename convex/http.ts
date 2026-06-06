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

function renderStatusPage(title: string, heading: string, description: string, accent: string, statusCode: 404 | 410) {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
          :root {
            color-scheme: dark;
          }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            background:
              radial-gradient(circle at top left, rgba(33,94,104,0.26), transparent 35%),
              radial-gradient(circle at bottom right, rgba(92,147,150,0.14), transparent 32%),
              #013137;
            color: #f8fafc;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            padding: 24px;
          }
          .card {
            width: min(100%, 560px);
            border-radius: 28px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(1, 31, 55, 0.9);
            backdrop-filter: blur(18px);
            box-shadow: 0 20px 60px rgba(0,0,0,0.45);
            padding: 32px;
          }
          .eyebrow {
            text-transform: uppercase;
            letter-spacing: 0.24em;
            font-size: 11px;
            font-weight: 700;
            color: ${accent};
            margin-bottom: 12px;
          }
          h1 {
            margin: 0;
            font-size: clamp(2rem, 4vw, 3rem);
            line-height: 1.05;
          }
          p {
            margin: 14px 0 0;
            color: #94a3b8;
            font-size: 1rem;
            line-height: 1.7;
          }
          a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-top: 24px;
            border-radius: 16px;
            padding: 12px 18px;
            background: linear-gradient(135deg, #215E68, #297376);
            color: white;
            text-decoration: none;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <main class="card">
          <div class="eyebrow">Scissor</div>
          <h1>${heading}</h1>
          <p>${description}</p>
          <a href="/">Back to Scissor</a>
        </main>
      </body>
    </html>`,
    {
      status: statusCode,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
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
      return renderStatusPage(
        "Link Not Found - Scissor",
        "Link not found",
        "The short link does not exist, has been deleted, or was entered incorrectly.",
        "#C1D9DE",
        404
      );
    }

    // 3. Handle expired link
    if (link.status === "expired" || (link.expiresAt && link.expiresAt <= Date.now())) {
      return renderStatusPage(
        "Link Expired - Scissor",
        "Link expired",
        "This short link has expired and is no longer accepting redirects.",
        "#5C9396",
        410
      );
    }

    // 4. Capture Click Analytics from Request Headers
    const userAgent = request.headers.get("user-agent");
    const referrerUrl = request.headers.get("referer");
    // Retrieve country from Vercel header first, then Cloudflare, then fallback
    const country = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "US"; 
    
    const device = getDeviceType(userAgent);
    const referrer = parseReferrer(referrerUrl);
    const visitorKey = [userAgent || "unknown", referrer, country, device].join("|");

    // 5. Track click asynchronously
    await ctx.runMutation(api.clicks.trackClick, {
      linkId: link._id,
      referrer,
      country,
      device,
      visitorKey,
    });

    // 6. Return 302 Found Redirect
    return Response.redirect(link.originalUrl, 302);
  }),
});

export default http;
