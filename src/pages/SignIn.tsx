import { SignIn } from "@clerk/clerk-react";
import { Link2 } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#011F23] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs - Teal/Dark */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-primary-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-soft-900/10 blur-[100px] pointer-events-none" />

      {/* Branding */}
      <div className="mb-8 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-3 bg-gradient-to-tr from-primary-600 to-soft-500 rounded-2xl shadow-xl shadow-primary-950/20">
          <Link2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight font-display text-white flex items-center gap-2">
          Scissor
          <span className="text-xs uppercase bg-primary-500/20 text-soft-200 font-bold px-2 py-1 rounded-lg border border-primary-500/20">
            Auth
          </span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">Welcome back to your workspace</p>
      </div>

      {/* Clerk Component */}
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl overflow-hidden",
              headerTitle: "text-white font-display",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all duration-200",
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500 text-xs uppercase tracking-widest",
              formFieldLabel: "text-slate-300 text-sm font-semibold mb-1.5",
              formFieldInput: "bg-white/5 border-white/10 text-white rounded-xl focus:border-primary-500/50 focus:ring-primary-500/20 transition-all",
              formButtonPrimary: "bg-gradient-to-r from-primary-600 to-soft-500 hover:from-primary-500 hover:to-soft-400 border-none shadow-lg shadow-primary-950/20 text-sm font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]",
              footerActionLink: "text-soft-300 hover:text-soft-200 font-bold transition-colors",
              identityPreviewText: "text-white",
              identityPreviewEditButtonIcon: "text-soft-300",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      </div>
    </div>
  );
}
