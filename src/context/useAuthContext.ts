import { useContext } from "react";
import { AuthContext } from "./authCore";

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within a UnifiedAuthProvider");
  }
  return context;
}
