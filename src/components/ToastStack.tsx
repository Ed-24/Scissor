import { type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

const TOAST_ICON: Record<string, ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

export default function ToastStack() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl transition-all ${
            toast.variant === "success"
              ? "border-soft-500/25 bg-primary-950/70 text-light-200"
              : toast.variant === "error"
                ? "border-soft-500/25 bg-dark-900/80 text-slate-100"
                : "border-soft-500/25 bg-dark-950/80 text-light-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-current">{TOAST_ICON[toast.variant]}</div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{toast.title}</div>
              {toast.description ? <div className="mt-1 text-xs text-current/75">{toast.description}</div> : null}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="rounded-full p-1 text-current/60 transition hover:bg-white/10 hover:text-current"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
