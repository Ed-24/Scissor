import { SignUp } from "@clerk/clerk-react";
import { Link2 } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#050407] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-900/10 blur-[100px] pointer-events-none" />

      {/* Branding */}
      <div className="mb-8 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="p-3 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-2xl shadow-xl shadow-purple-900/20">
          <Link2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight font-display text-white flex items-center gap-2">
          Scissor
          <span className="text-xs uppercase bg-purple-500/20 text-purple-300 font-bold px-2 py-1 rounded-lg border border-purple-500/20">
            Join
          </span>
        </h1>
        <p className="text-slate-400 text-sm font-medium">Create your professional short links</p>
      </div>

      {/* Clerk Component */}
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-950/50 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden",
              headerTitle: "text-white font-display",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-white/5 border-white/10 hover:bg-white/10 text-white transition-all duration-200",
              socialButtonsBlockButtonText: "text-white font-medium",
              dividerLine: "bg-white/10",
              dividerText: "text-slate-500 text-xs uppercase tracking-widest",
              formFieldLabel: "text-slate-300 text-sm font-semibold mb-1.5",
              formFieldInput: "bg-white/5 border-white/10 text-white rounded-xl focus:border-purple-500/50 focus:ring-purple-500/20 transition-all",
              formButtonPrimary: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-none shadow-lg shadow-purple-900/20 text-sm font-bold py-2.5 rounded-xl transition-all active:scale-[0.98]",
              footerActionLink: "text-purple-400 hover:text-purple-300 font-bold transition-colors",
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          afterSignUpUrl="/dashboard"
        />
      </div>
    </div>
  );
}
