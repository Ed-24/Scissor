import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#c8c6d7] p-4 text-[#3d245d]">
      <div className="pointer-events-none absolute left-[18%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-white/35 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[8%] h-[22rem] w-[22rem] rounded-full bg-white/25 blur-[100px]" />

      <div className="mb-8 flex flex-col items-center gap-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight font-display text-[#3d245d]">
          Scissor
        </h1>
        <p className="text-sm font-medium text-[#5b4c73]">Welcome back to your workspace</p>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "rounded-3xl border border-[#d8cfee] bg-white/65 shadow-2xl shadow-[#b79bdb]/15 backdrop-blur-2xl",
              headerTitle: "font-display text-[#3d245d]",
              headerSubtitle: "text-[#5b4c73]",
              socialButtonsBlockButton: "border border-[#d8cfee] bg-white/70 text-[#3d245d] hover:bg-white transition-all duration-200",
              socialButtonsBlockButtonText: "text-[#3d245d] font-medium",
              dividerLine: "bg-[#d8cfee]",
              dividerText: "text-[#7f7396] text-xs uppercase tracking-widest",
              formFieldLabel: "mb-1.5 text-sm font-semibold text-[#5b4c73]",
              formFieldInput: "rounded-xl border border-[#d8cfee] bg-[#f8f5fd] text-[#3d245d] focus:border-[#9b7bc7] focus:ring-[#9b7bc7]/20 transition-all",
              formButtonPrimary: "rounded-xl border-none bg-[#783f8e] py-2.5 text-sm font-bold text-white shadow-lg shadow-[#783f8e]/20 transition-all hover:bg-[#652f79] active:scale-[0.98]",
              footerActionLink: "font-bold text-[#783f8e] transition-colors hover:text-[#652f79]",
              identityPreviewText: "text-[#3d245d]",
              identityPreviewEditButtonIcon: "text-[#7f7396]",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/shorten"
        />
      </div>
    </div>
  );
}
