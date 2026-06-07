import { useEffect } from "react";

/**
 * Redirect handling happens server-side through Convex HTTP actions.
 * This component stays mounted so the app shell can include it safely.
 */
export default function RedirectHandler() {
  useEffect(() => {
    // Intentionally empty in real-backend mode.
  }, []);

  return null;
}
