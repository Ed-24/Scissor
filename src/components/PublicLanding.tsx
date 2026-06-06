import ShortenForm from "../components/ShortenForm";

export default function PublicLanding() {
  return (
    <div className="flex-1 flex flex-col justify-start relative z-10 w-full animate-in fade-in duration-500">
      <ShortenForm />
    </div>
  );
}
