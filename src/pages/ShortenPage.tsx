import ShortenForm from "../components/ShortenForm";

export default function ShortenPage() {
  return (
    <div className="relative z-10 flex min-h-full w-full items-start justify-center bg-[#c8c6d7] px-4 py-10 animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.16),_rgba(255,255,255,0.02))]" />
      <div className="pointer-events-none absolute left-1/2 top-[36%] h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-3xl" />
      <div className="relative z-10 w-full max-w-5xl">
        <ShortenForm />
      </div>
    </div>
  );
}
