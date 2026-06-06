import { useEffect } from "react";
import { isMockMode, type MockState, type MockLinkRecord } from "../context/authCore";

/**
 * RedirectHandler handles short link redirections in Local Demo Mode.
 * In production, this is handled by Convex's HTTP actions.
 */
export default function RedirectHandler() {
  useEffect(() => {
    if (isMockMode() && typeof window !== "undefined" && window.location.pathname.startsWith("/s/")) {
      const slug = window.location.pathname.slice(3);
      if (slug) {
        try {
          // In mock mode, we check the global mock state
          const root = window as unknown as { __SCISSOR_MOCK_STATE__?: MockState };
          const state = root.__SCISSOR_MOCK_STATE__;
          
          if (state && state.links) {
            const link = state.links.find((l: MockLinkRecord) => l.slug === slug);
            if (link) {
              // Track click in mock clicks
              const click = {
                _id: `click_${Math.random().toString(36).slice(2, 9)}`,
                linkId: link._id,
                timestamp: Date.now(),
                referrer: "Direct",
                country: "US",
                device: "Desktop",
                visitorKey: "demo-visitor",
              };
              state.clicks.push(click);
              link.clickCount = (link.clickCount || 0) + 1;

              // Perform redirect
              setTimeout(() => {
                window.location.href = link.originalUrl;
              }, 100);
              return;
            }
          }
          
          // Link not found UI
          document.body.innerHTML = `
            <div style="background:#050407;color:#f87171;font-family:sans-serif;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;">
              <h1 style="margin:0;font-size:2rem;">404: Link Not Found</h1>
              <p style="color:#94a3b8;margin:0;">The short link with slug "${slug}" does not exist in local storage.</p>
              <a href="/" style="color:#a855f7;text-decoration:none;font-weight:bold;margin-top:12px;">Go Back to Scissor</a>
            </div>
          `;
        } catch (e) {
          console.error("Failed to execute mock redirect", e);
        }
      }
    }
  }, []);

  return null;
}
